import { create } from 'zustand';
import { useTerminalStore } from './terminalStore';  // Import the terminal store to add entries

interface Connection {
    hostname: string | null;
    username: string | null;
    password: string | null;
    state: boolean; // true if connected, false if not
}

interface ConnectionStore {
    connection: Connection;
    connect: (hostname: string, username: string, password: string) => Promise<boolean>;
    disconnect: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
    connection: {
        hostname: null,
        username: null,
        password: null,
        state: false,
    },

    // This method now includes a check to verify if we can reach the host
    // Returns true if it could connect, or false if it could not
    connect: async (hostname, username, password) => {
        const { addTerminalEntry } = useTerminalStore.getState();

        try {
            // Attempt to connect to the host (replace with your actual connection check logic)
            const response = await fetch('/api/ssh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostname, username, password }),
            });

            if (!response.ok) {
                throw new Error('Failed to connect to the host');
            }

            // If the connection is successful, update the state
            set({
                connection: {
                    hostname,
                    username,
                    password,
                    state: true,
                },
            });

            // Add a success message to the terminal buffer
            
            addTerminalEntry(`🟢 Successfully connected to ${hostname}`, 'output');
            return true
        } catch (error) {
            // If connection fails, update the connection state and add error to terminal buffer
            set({
                connection: {
                    hostname,
                    username,
                    password,
                    state: false,
                },
            });

            const errorMessage = error instanceof Error ? error.message : 'Unknown SSH error';
            addTerminalEntry(`Connection error: ${errorMessage}`, 'error'); // Write the error directly to the terminal buffer
            return false
        }
    },

    // Disconnect and clear any connection data
    disconnect: () => {
        const { addTerminalEntry } = useTerminalStore.getState();
        addTerminalEntry("🟥 Disconnecting from host", 'command')
        set({
            connection: {
                hostname: null,
                username: null,
                password: null,
                state: false,
            },
        });
    },
}));
