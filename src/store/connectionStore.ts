import { create } from 'zustand';
import { TerminalEntry, useTerminalStore } from './terminalStore';  // Import the terminal store to add entries

interface Connection {
    hostname: string | null;
    username: string | null;
    password: string | null;
    enablepass: string | null;
    state: boolean; // true if connected, false if not
}

interface ConnectionStore {
    connection: Connection;
    connect: (hostname: string, username: string, password: string, enablepass?: string) => Promise<boolean>;
    disconnect: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
    connection: {
        hostname: null,
        username: null,
        password: null,
        enablepass: null,
        state: false,
    },

    // Method to connect and test the SSH connection
    connect: async (hostname, username, password, enablepass?) => {
        const { addTerminalEntry } = useTerminalStore.getState();

        try {
            // Send the connection request with no commands (empty array) to test the SSH connection
            const response = await fetch('/api/ssh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostname, username, password, commands: [], enablepass }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to connect to the host');
            }

            // Process the TerminalEntry[] response from the server
            const terminalEntries: TerminalEntry[] = data.output;
            terminalEntries.forEach((entry) => addTerminalEntry(entry.content, entry.type));

            // If there's at least one "output" entry, assume the connection was successful
            const isConnected = terminalEntries.some(entry => entry.type === 'output' && entry.content.includes('Successfully connected'));

            if (isConnected) {
                set({
                    connection: {
                        hostname,
                        username,
                        password,
                        enablepass: enablepass || null,
                        state: true,
                    },
                });

                if (enablepass) {
                    fetchConfiguration()
                }

                return true;
            } else {
                // If no successful connection message, set state as disconnected
                set({
                    connection: {
                        hostname,
                        username,
                        password,
                        enablepass: enablepass || null,
                        state: false,
                    },
                });
                return false;
            }

        } catch (error) {
            // If connection fails, update the connection state and add error to terminal buffer
            set({
                connection: {
                    hostname,
                    username,
                    password,
                    enablepass: enablepass || null,
                    state: false,
                },
            });

            const errorMessage = error instanceof Error ? error.message : 'Unknown SSH error';
            addTerminalEntry(`Connection error: ${errorMessage}`, 'error');
            return false;
        }
    },

    // Disconnect and clear any connection data
    disconnect: () => {
        const { addTerminalEntry } = useTerminalStore.getState();
        addTerminalEntry("🟥 Disconnecting from host", 'command');
        set({
            connection: {
                hostname: null,
                username: null,
                password: null,
                enablepass: null,
                state: false,
            },
        });
    },
}));



function fetchConfiguration() {
    console.log('Function not implemented.');
}

