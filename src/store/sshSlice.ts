// store.ts
import { create } from 'zustand';

// The terminal buffer is a list of terminal entries, these entries store the type of entry, and the data in that entry.
interface TerminalEntry {
    type: 'command' | 'output' | 'error';  // Defines the type of the terminal entry
    content: string;  // The content of the entry (command, output, or error message)
}

interface SshStore {
    // Loading state. True when we are waiting for a reply from the server.
    loading: boolean;

    terminalBuffer: TerminalEntry[];  // Store terminal entries with type and content
    clearTerminalBuffer: () => void,

    // Function to execute SSH commands and update terminal buffer
    executeCommands: (input: { hostname: string; username: string; password: string; commands: string[] }) => Promise<void>;
}

export const useSshStore = create<SshStore>((set) => ({
    loading: false,

    terminalBuffer: [],  // Store that holds all terminal entries

    clearTerminalBuffer: () => {
        set({ terminalBuffer: [] })
    },

    // Function to execute commands and update terminal buffer accordingly
    executeCommands: async ({ hostname, username, password, commands }) => {
        set({ loading: true });

        // Sanitize commands, so that we don't append empty strings to the buffer:
        if (commands.length === 0 || (commands[0].trim() === "" && commands.length === 1)) {
            commands = []
        }

        // For each command, we add it to the terminal buffer and process the response
        for (const cmd of commands) {
            // Add the command to the terminal buffer
            set((state) => ({
                terminalBuffer: [
                    ...state.terminalBuffer,
                    { type: 'command', content: cmd },
                ]
            }));
        }
        // Execute the command, append the response to the buffer
        try {
            const response = await fetch('/api/ssh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostname, username, password, commands }),
            });

            const data = await response.json();

            if (response.ok) {
                // We check if the returned output includes the word 'error'. If it does we change the line type to error
                const outputLines = data.output.split('\n').map((line: string) => {
                    const isError = line.toLowerCase().includes('error');  // Check for 'error' in line
                    return {
                        type: isError ? 'error' : 'output',  // Mark as error or output
                        content: line,
                    };
                });

                // Add processed output lines to the buffer
                set((state) => ({
                    terminalBuffer: [...state.terminalBuffer, ...outputLines]
                }));


            } else {
                // Add the error message to the terminal buffer
                set((state) => ({
                    terminalBuffer: [
                        ...state.terminalBuffer,
                        { type: 'error', content: data.error[0] }
                    ]
                }));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Add the error message to the terminal buffer
            set((state) => ({
                terminalBuffer: [
                    ...state.terminalBuffer,
                    { type: 'error', content: errorMessage }
                ]
            }));
        }


        // Reset execution status after command execution
        set({ loading: false });
    },
}));
