import { create } from 'zustand';

interface TerminalEntry {
    type: 'command' | 'output' | 'error';
    content: string;
}

interface TerminalStore {
    terminalBuffer: TerminalEntry[];
    addTerminalEntry: (content: string, type: TerminalEntry["type"]) => void;
    clearTerminalBuffer: () => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
    terminalBuffer: [],

    addTerminalEntry: (content, type) => {
        set((state) => ({
            terminalBuffer: [
                ...state.terminalBuffer,
                { type, content }
            ]
        }));
    },

    clearTerminalBuffer: () => {
        set({ terminalBuffer: [] });
    }
}));
