import { create } from 'zustand';
import { useConnectionStore } from './connectionStore';  
import { useTerminalStore } from './terminalStore';      

interface CommandStore {
    loading: boolean;
    executeCommands: (rawCommands:string) => Promise<void>;
}

export const useCommandStore = create<CommandStore>((set) => ({
    loading: false,

    executeCommands: async (rawCommands) => {
        const { connection } = useConnectionStore.getState();
        const { addTerminalEntry } = useTerminalStore.getState();
        set({ loading: true });

        if (!connection.hostname || !connection.username || !connection.password) {
            addTerminalEntry('No valid SSH connection', 'error');
            set({ loading: false });
            return;
        }

        const commands = rawCommands?.split(/\r?\n/).filter(line => line.trim() !== '');

        for (const cmd of commands) {
            addTerminalEntry(cmd, 'command');
            
            try {
                const response = await fetch('/api/ssh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...connection, command: cmd }),
                });

                const data = await response.json();
                
                if (response.ok) {
                    const outputLines = data.output.split('\n');
                    outputLines.forEach((line: string) => addTerminalEntry(line, 'output'));
                } else {
                    addTerminalEntry(data.error, 'error');
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addTerminalEntry(errorMessage, 'error');
            }
        }

        set({ loading: false });
    }
}));
