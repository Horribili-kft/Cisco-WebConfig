import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, themes } from '../../tailwind.config'; // Importing themes

// Define the store's structure
interface SettingStore {
  theme: Theme;
  forceciscossh: boolean;
  usecompiledbinaries: boolean
  // Actions to update settings
  setTheme: (theme: Theme) => void;
  setForceCiscoSSH: (forceciscossh: boolean) => void;
  setUseCompiledBinaries: (usecompiledbinaries: boolean) => void;
}


export const useSettingsStore = create<SettingStore>()(
  // We store this whole store in localstorage.
  persist(
    (set) => ({
      theme: themes[0],
      forceciscossh: false, // Don't force by default
      usecompiledbinaries: false,

      setTheme: (theme: Theme) => set({ theme }),
      setForceCiscoSSH: (forceciscossh: boolean) => set({ forceciscossh }),
      setUseCompiledBinaries: (usecompiledbinaries: boolean) => set({ usecompiledbinaries }),

    }),
    {
      name: 'settings-storage',
    }
  )
);
