import { create } from 'zustand';
import type { ViewMode, SidebarPanel, Notification, FileEntry } from '../types';

interface UIState {
  viewMode: ViewMode;
  sidebarPanel: SidebarPanel;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  isZenMode: boolean;
  splitRatio: number;
  notifications: Notification[];
  explorerFolderPath: string | null;
  explorerEntries: Record<string, FileEntry[]>;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  cycleViewMode: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleZenMode: () => void;
  setSplitRatio: (ratio: number) => void;
  addNotification: (type: Notification['type'], message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  setExplorerFolder: (path: string, entries: FileEntry[]) => void;
  updateExplorerEntries: (dirPath: string, entries: FileEntry[]) => void;
  clearExplorerFolder: () => void;
}

const getInitialViewMode = (): ViewMode => {
  try {
    const stored = localStorage.getItem('lekh-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.defaultViewMode) return parsed.defaultViewMode;
    }
  } catch {}
  return 'split';
};

export const useUIStore = create<UIState>((set, get) => ({
  viewMode: getInitialViewMode(),
  sidebarPanel: 'explorer',
  isSidebarOpen: true,
  isCommandPaletteOpen: false,
  isZenMode: false,
  splitRatio: 50,
  notifications: [],
  explorerFolderPath: null,
  explorerEntries: {},

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  cycleViewMode: () => {
    const modes: ViewMode[] = ['editor', 'split', 'preview'];
    const { viewMode } = get();
    const idx = modes.indexOf(viewMode);
    set({ viewMode: modes[(idx + 1) % modes.length] });
  },

  setSidebarPanel: (panel: SidebarPanel) => {
    const { sidebarPanel } = get();
    if (sidebarPanel === panel) {
      set({ isSidebarOpen: false, sidebarPanel: null });
    } else {
      set({ isSidebarOpen: true, sidebarPanel: panel });
    }
  },

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  toggleCommandPalette: () =>
    set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),

  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

  toggleZenMode: () =>
    set((s) => ({
      isZenMode: !s.isZenMode,
      isSidebarOpen: s.isZenMode ? true : false,
    })),

  setSplitRatio: (ratio: number) => set({ splitRatio: ratio }),

  addNotification: (type, message, duration = 4000) => {
    const id = crypto.randomUUID();
    const notification: Notification = { id, type, message, duration };
    set((s) => ({ notifications: [...s.notifications, notification] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id: string) => {
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    }));
  },

  setExplorerFolder: (path: string, entries: FileEntry[]) => set({
    explorerFolderPath: path,
    explorerEntries: { [path]: entries },
    isSidebarOpen: true,
    sidebarPanel: 'explorer',
  }),

  updateExplorerEntries: (dirPath: string, entries: FileEntry[]) => set((s) => ({
    explorerEntries: { ...s.explorerEntries, [dirPath]: entries },
  })),

  clearExplorerFolder: () => set({
    explorerFolderPath: null,
    explorerEntries: {},
  }),
}));
