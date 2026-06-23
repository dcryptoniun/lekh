// ============================================================
// Core type definitions for the MD Editor application
// ============================================================

/** Represents a single editor tab */
export interface EditorTab {
  id: string;
  name: string;
  path: string | null;
  content: string;
  savedContent: string;
  isModified: boolean;
  cursorLine: number;
  cursorCol: number;
  scrollPos: number;
}

/** View mode for the editor area */
export type ViewMode = 'editor' | 'preview' | 'split';

/** Theme mode */
export type ThemeMode = 'dark' | 'light' | 'system';

/** Sidebar panel types */
export type SidebarPanel = 'explorer' | 'outline' | 'search' | null;

/** A file/directory entry from Tauri */
export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  extension: string | null;
}

/** File info returned from reading a file */
export interface FileInfo {
  path: string;
  content: string;
  name: string;
  extension: string | null;
}

/** Content statistics */
export interface ContentStats {
  words: number;
  characters: number;
  lines: number;
  paragraphs: number;
}

/** Outline heading entry for TOC */
export interface OutlineHeading {
  id: string;
  text: string;
  level: number;
  children: OutlineHeading[];
}

/** Command palette command */
export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

/** Editor settings */
export interface FavoriteFolder {
  path: string;
  name: string;
}

export interface EditorSettings {
  theme: ThemeMode;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  vimMode: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  showInvisibles: boolean;
  highlightActiveLine: boolean;
  bracketMatching: boolean;
  indentWithTabs: boolean;
  previewCodeTheme: string;
  defaultSaveLocation: string | null;
  favoriteFolders: FavoriteFolder[];
  rememberWindowSize: boolean;
  restoreLastSession: boolean;
  defaultViewMode: ViewMode;
}

/** Recent file entry */
export interface RecentFile {
  path: string;
  name: string;
  timestamp: number;
}

/** Search result */
export interface SearchResult {
  line: number;
  column: number;
  text: string;
  match: string;
}

/** Notification type */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/** Notification */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}
