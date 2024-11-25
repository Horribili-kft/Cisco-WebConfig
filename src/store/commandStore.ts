import { create } from 'zustand';
import { TerminalEntry, useTerminalStore } from './terminalStore';
import { useDeviceStore } from './deviceStore';
import { apicall } from '@/helpers/apicall';
import { useSettingsStore } from './settingsStore';

interface CommandStore {
    loading: boolean;
    executeCommands: (rawCommands: string) => Promise<void>;
    selectedInterfaces: Set<string>,
    toggleInterface: (item: string) => void;
}

export const useCommandStore = create<CommandStore>((set) => ({
    loading: false,
    selectedInterfaces: new Set(),

    toggleInterface: (item: string) =>
        set((state) => {
            const { selectionmode } = useSettingsStore.getState();
            let newSet;

            if (!selectionmode) {
                // Single selection mode: Replace with only the new item
                newSet = new Set([item]); // Start with an empty set and add only the new item
            } else {
                // Multiple selection mode: Toggle the item's presence in the set
                newSet = new Set(state.selectedInterfaces); // Clone the current set
                if (newSet.has(item)) {
                    newSet.delete(item); // If the item is present, remove it
                } else {
                    newSet.add(item); // If the item is not present, add it
                }
            }

            console.log(state.selectedInterfaces);
            console.log(newSet.has(item));

            return { selectedInterfaces: newSet }; // Return updated state
        }),



    // Executes commands
    executeCommands: async (rawCommands) => {
        const { device, connection } = useDeviceStore.getState();
        const { addTerminalEntry } = useTerminalStore.getState();
        set({ loading: true });

        if (!connection.hostname || !connection.username || !connection.password) {
            addTerminalEntry('No valid SSH connection', 'error');
            set({ loading: false });
            return;
        }

        // We split the commmands into an array, with each line being an element of that array.
        let commands = rawCommands?.split(/\r?\n/).filter(line => line.trim() !== '');

        if (commands.length === 0) {
            addTerminalEntry('No commands to execute', 'error');
            set({ loading: false });
            return;
        }

        // We prepare the command by prepending them with device specific commands
        if (device?.type === 'cisco_switch' || device?.type === 'cisco_router' || device?.type === 'cisco_firewall') {
            commands = ['terminal length 0', 'configure terminal', ...commands]
        }

        try {
            // Send all commands to the server in a single request
            const response = await apicall({
                hostname: connection.hostname,
                username: connection.username,
                password: connection.password,
                commands,
                devicetype: device?.type,
                enablepass: connection.enablepass || undefined,
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
