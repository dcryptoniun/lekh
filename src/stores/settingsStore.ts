import { create } from 'zustand';
import type { EditorSettings, ThemeMode } from '../types';

const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'dark',
  fontSize: 15,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  minimap: false,
  vimMode: false,
  autoSave: true,
  autoSaveInterval: 30000,
  showInvisibles: false,
  highlightActiveLine: true,
  bracketMatching: true,
  indentWithTabs: false,
  previewCodeTheme: 'github-dark',
};

interface SettingsState {
  settings: EditorSettings;
  isSettingsOpen: boolean;
  updateSetting: <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSettings: () => void;
  closeSettings: () => void;
  resetSettings: () => void;
  loadSettings: () => void;
}

const loadSettingsFromStorage = (): EditorSettings => {
  try {
    const stored = localStorage.getItem('lekh-settings');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
};

const saveSettingsToStorage = (settings: EditorSettings): void => {
  try {
    localStorage.setItem('lekh-settings', JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettingsFromStorage(),
  isSettingsOpen: false,

  updateSetting: (key, value) => {
    set((state) => {
      const newSettings = { ...state.settings, [key]: value };
      saveSettingsToStorage(newSettings);
      return { settings: newSettings };
    });
  },

  setTheme: (theme: ThemeMode) => {
    const { updateSetting } = get();
    updateSetting('theme', theme);
    applyTheme(theme);
  },

  toggleSettings: () => set((s) => ({ isSettingsOpen: !s.isSettingsOpen })),
  closeSettings: () => set({ isSettingsOpen: false }),

  resetSettings: () => {
    saveSettingsToStorage(DEFAULT_SETTINGS);
    set({ settings: { ...DEFAULT_SETTINGS } });
    applyTheme(DEFAULT_SETTINGS.theme);
  },

  loadSettings: () => {
    const settings = loadSettingsFromStorage();
    set({ settings });
    applyTheme(settings.theme);
  },
}));

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  let effective: 'dark' | 'light' = 'dark';

  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    effective = theme;
  }

  root.setAttribute('data-theme', effective);
}
