// store.ts
import { create } from 'zustand';

interface SshStore {

    execution: {
        loading: boolean;
        output: string | null;
        error: string | null;
    };

    // Array to store executed commands. This is a history of commands, not the commands meant to be executed
    commands: string[]; 

    addCommand: (command: string) => void; // Function to add a command

    executeCommands: (input: { hostname: string; username: string; password: string; commands: string[] }) => Promise<void>;
}

export const useSshStore = create<SshStore>((set) => ({
    execution: { loading: false, error: null, output: null },

    commands: [], // Initialize with an empty array

    addCommand: (command: string) => set((state) => ({ commands: [...state.commands, command] })), // Append command


    executeCommands: async ({ hostname, username, password, commands }) => {
        // Elkezdjük a parancsok futtatását
        set({ execution: { loading: true, error: null, output: null } });
        try {
            const response = await fetch('/api/ssh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hostname, username, password, commands }),
            });

            const data = await response.json();
            if (response.ok) {
                set({ execution: { loading: false, output: data.output, error: null } });
            } else {
                set({ execution: { loading: false, output: null, error: data.error } });
            }
        } catch (error) {
            // Ensure error is always an object with a message
            const errorMessage = error instanceof Error ? error.message : String(error);
            set({ execution: { loading: false, output: null, error: errorMessage } });
        }
    },
}));
