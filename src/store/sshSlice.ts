// This store executes commands and stores the output of the commands in a terminal buffer. 
// It also provides a loading variable, that is true when we are executing the commnad
import { create } from 'zustand';

// The terminal buffer is a list of terminal entries, these entries store the type of entry, and the data in that entry.
interface TerminalEntry {
    type: 'command' | 'output' | 'error';  // Defines the type of the terminal entry
    content: string;  // The content of the entry (command, output, or error message)
}

interface Connection {
    hostname: string | null;
    username: string | null;
    password: string | null;
    state: boolean
}

interface SshStore {
    // Loading state. True when we are waiting for a reply from the server.
    loading: boolean;

    // Store terminal entries with type and content
    terminalBuffer: TerminalEntry[];

    // See above interface for details
    connection: Connection

    //
    disconnect: () => void

    // Function to clear the terminal
    clearTerminalBuffer: () => void,

    // Function to add some text to the terminal.
    addToTerminalBuffer: (content: string, type?: TerminalEntry["type"]) => void;

    // Function to execute SSH commands and update terminal buffer
    executeCommands: (input: { hostname: string; username: string; password: string; rawCommands?: string }) => Promise<void>;

}

export const useSshStore = create<SshStore>((set) => ({
    loading: false,

    connection: {
        hostname: null,
        username: null,
        password: null,
        state: false
    },

    terminalBuffer: [],  // Store that holds all terminal entries

    disconnect: () => {
        set({ connection: { hostname: null, username: null, password: null, state: false } })
    },

    clearTerminalBuffer: () => {
        set({ terminalBuffer: [] })
    },

    addToTerminalBuffer: (content, type?) => {
        set((state) => ({
            terminalBuffer: [
                ...state.terminalBuffer,
                { type: type || 'error', content: content }
            ]
        }));
    },

    // Function to execute commands and update terminal buffer accordingly. It expects raw commands as typed in a textbox, and executes each command one at a time, splitting them by newlines.
    executeCommands: async ({ hostname, username, password, rawCommands }) => {
        set({ loading: true });

        // ------------- IF THERE IS A COMMAND DEFINED, WE EXECUTE THEM ONE BY ONE.  ------------- //
        if (rawCommands) {
            let commands = rawCommands.split(/\r?\n/).filter(line => line.trim() !== '') // We filter out empty strings. This is also done on the client, but this way they don't get added to the buffer either

            // For each command, we add it to the terminal buffer and process the response
            for (const cmd of commands) {

                // Add the command to the terminal buffer
                set((state) => ({
                    terminalBuffer: [
                        ...state.terminalBuffer,
                        { type: 'command', content: cmd },
                    ]
                }));


                // Execute the command, append the response to the buffer
                try {
                    const response = await fetch('/api/ssh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ hostname, username, password, command: cmd }),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        const outputLines = data.output.split('\n').map((line: string) => ({
                            type: 'output',  // Mark everything as 'output'
                            content: line,
                        }));

                        set({ connection: { hostname, username, password, state: true } });

                        // Add processed output lines to the buffer
                        set((state) => ({
                            terminalBuffer: [...state.terminalBuffer, ...outputLines]
                        }));

                    }

                    // If the response returned something other than 200
                    else {
                        // Add the error message to the terminal buffer
                        set({ connection: { hostname, username, password, state: false } });
                        set((state) => ({
                            terminalBuffer: [
                                ...state.terminalBuffer,
                                { type: 'error', content: data.error }
                            ]
                        }));
                    }
                }

                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    set({ connection: { hostname, username, password, state: false } });
                    // Add the error message to the terminal buffer
                    set((state) => ({
                        terminalBuffer: [
                            ...state.terminalBuffer,
                            { type: 'error', content: errorMessage }
                        ]
                    }));
                }





            }

        }
        // ------------- IF NO COMMAND IS DEFINED, WE TEST THE CONNECTION ------------- //
        else {
            // Execute the command, append the response to the buffer
            try {
                const response = await fetch('/api/ssh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hostname, username, password, command: '' }),
                });

                const data = await response.json();
                if (response.ok) {
                    const outputLines = data.output.split('\n').map((line: string) => ({
                        type: 'output',  // Mark everything as 'output'
                        content: line,
                    }));

                    set({ connection: { hostname, username, password, state: true } });

                    // Add processed output lines to the buffer
                    set((state) => ({
                        terminalBuffer: [...state.terminalBuffer, ...outputLines]
                    }));
                }

                // If the response returned something other than 200
                else {
                    // Add the error message to the terminal buffer
                    set({ connection: { hostname, username, password, state: false } });
                    set((state) => ({
                        terminalBuffer: [
                            ...state.terminalBuffer,
                            { type: 'error', content: data.error }
                        ]
                    }));
                }
            }

            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                set({ connection: { hostname, username, password, state: false } });
                // Add the error message to the terminal buffer
                set((state) => ({
                    terminalBuffer: [
                        ...state.terminalBuffer,
                        { type: 'error', content: errorMessage }
                    ]
                }));
            }
        }




        // Reset execution status after command execution
        set({ loading: false });
    },

}));

