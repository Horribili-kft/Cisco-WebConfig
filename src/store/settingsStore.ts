import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, themes } from '../../tailwind.config'; // Importing themes

// Define the store's structure
interface SettingStore {

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Force ssh
  forceciscossh: boolean;
  setForceCiscoSSH: (forceciscossh: boolean) => void;

  // Python precompiled binaries
  usecompiledbinaries: boolean
  setUseCompiledBinaries: (usecompiledbinaries: boolean) => void;

  // Selection mode (true: many, false: single, this is for interfaces) 
  selectionmode: boolean
  setSelectionMode: (selectionmode: boolean) => void;
}


export const useSettingsStore = create<SettingStore>()(
  // We store all settings in localstorage
  persist(
    (set) => ({
      theme: themes[0],
      setTheme: (theme: Theme) => set({ theme }),


      setForceCiscoSSH: (forceciscossh: boolean) => set({ forceciscossh }),
      forceciscossh: false, // Don't force by default


      setUseCompiledBinaries: (usecompiledbinaries: boolean) => set({ usecompiledbinaries }),
      usecompiledbinaries: false,

      // Selection mode (true: many, false: single, this is for interfaces, we select a single interface by default) 
      selectionmode: true,
      setSelectionMode: (selectionmode: boolean) => set({ selectionmode }),



    }),
    {
      name: 'settings-storage',
    }
  )
);
