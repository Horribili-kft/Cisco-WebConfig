import { create } from 'zustand';
import { TerminalEntry, useTerminalStore } from './terminalStore';
import { useDeviceStore } from './deviceStore';

interface CommandStore {
    loading: boolean;
    executeCommands: (rawCommands: string) => Promise<void>;
}

export const useCommandStore = create<CommandStore>((set) => ({
    loading: false,

    executeCommands: async (rawCommands) => {
        const { device, connection } = useDeviceStore.getState();
        const { addTerminalEntry } = useTerminalStore.getState();
        set({ loading: true });

        if (!connection.hostname || !connection.username || !connection.password) {
            addTerminalEntry('No valid SSH connection', 'error');
            set({ loading: false });
            return;
        }

        const commands = rawCommands?.split(/\r?\n/).filter(line => line.trim() !== '');

        if (commands.length === 0) {
            addTerminalEntry('No commands to execute', 'error');
            set({ loading: false });
            return;
        }

        try {
            // Send all commands to the server in a single request
            const response = await fetch('/api/ssh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...connection, devicetype: device?.type, commands }),
            });

            const data = await response.json();

            if (response.ok) {
                const terminalEntries: TerminalEntry[] = data.output;
                terminalEntries.forEach((entry) => addTerminalEntry(entry.content, entry.type));
                device?.fetchConfig(connection.hostname, connection.username, connection.password)
            } else {
                addTerminalEntry(data.error, 'error');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addTerminalEntry(errorMessage, 'error');
        }

        set({ loading: false });
    }
}));
