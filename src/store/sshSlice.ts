// stores/useSshStore.ts
import {create} from 'zustand';

interface SshCommandInput {
    hostname: string;
    username: string;
    password: string;
    commands: string[];
}

interface SshExecutionState {
    output: string | null;   // To store the command output
    error: string | null;     // To store any errors that occur
    loading: boolean;         // To indicate if a command is currently being executed
}

interface SshStore {
    input: SshCommandInput;                // SSH command input state
    execution: SshExecutionState;          // Command execution state
    setCommandInput: (input: SshCommandInput) => void; // Action to update input
    resetExecution: () => void;            // Action to reset execution state
    executeCommands: (input: SshCommandInput) => Promise<void>; // Action to execute commands
}

// Create the Zustand store
export const useSshStore = create<SshStore>((set) => ({
    input: {
        hostname: '',
        username: '',
        password: '',
        commands: [],
    },
    execution: {
        output: null,
        error: null,
        loading: false,
    },
    setCommandInput: (input) => set({ input }),
    resetExecution: () => set({
        execution: {
            output: null,
            error: null,
            loading: false,
        },
    }),
    executeCommands: async (input) => {
        set({ execution: { loading: true, error: null, output: null } }); // Start loading
        try {
            // Make a fetch request to your SSH API here
            const response = await fetch('/api/ssh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            });

            const data = await response.json();
            if (data.error) {
                // Handle error response from API
                set({ execution: { loading: false, error: data.error, output: null } });
            } else {
                // Update state with command output
                set({ execution: { loading: false, output: data.output, error: null } });
            }
        } catch (error) {
            // Handle fetch errors
            set({ execution: { loading: false, error: error.message, output: null } });
        }
    },
}));
