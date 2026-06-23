import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Toolbar } from './components/Toolbar/Toolbar';
import { TabBar } from './components/TabBar/TabBar';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { StatusBar } from './components/StatusBar/StatusBar';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { Settings } from './components/Settings/Settings';
import { Notifications } from './components/Notifications/Notifications';
import { useUIStore } from './stores/uiStore';
import { useEditorStore } from './stores/editorStore';
import { useSettingsStore } from './stores/settingsStore';
import './App.css';

// Tauri imports - wrapped in try/catch for web fallback
let openDialog: ((options: any) => Promise<string | null>) | null = null;
let saveDialog: ((options: any) => Promise<string | null>) | null = null;
let readTextFile: ((path: string) => Promise<string>) | null = null;
let writeTextFile: ((path: string, content: string) => Promise<void>) | null = null;

// Dynamically import Tauri APIs
async function initTauriApis() {
  try {
    const dialog = await import('@tauri-apps/plugin-dialog');
    openDialog = dialog.open as any;
    saveDialog = dialog.save as any;
    const fs = await import('@tauri-apps/plugin-fs');
    readTextFile = fs.readTextFile;
    writeTextFile = fs.writeTextFile;
  } catch {
    console.info('Running in browser mode (no Tauri APIs)');
  }
}

function App() {
  const { viewMode, isSidebarOpen, isZenMode, toggleCommandPalette, addNotification } = useUIStore();
  const { addTab, getActiveTab, markTabSaved } = useEditorStore();
  const { settings, loadSettings } = useSettingsStore();
  const splitRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  // Initialize
  useEffect(() => {
    loadSettings();
    initTauriApis().then(async () => {
      // Check window size setting
      const settingsState = useSettingsStore.getState().settings;
      if (!settingsState.rememberWindowSize) {
        try {
          const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          await win.setSize(new LogicalSize(1200, 800));
          await win.center();
        } catch (e) {
          // ignore
        }
      }
    });
  }, []);

  // Handle files opened via OS file association (double-click .md file) and session restore
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    (async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        // Check for files passed on app launch
        const openedPaths = await invoke<string[]>('get_opened_urls');
        let hasOpenedArgFile = false;
        for (const filePath of openedPaths) {
          if (/\.(md|markdown|mdx|txt)$/i.test(filePath)) {
            try {
              const fileInfo = await invoke<{ name: string; content: string; path: string }>('read_file', { path: filePath });
              addTab(fileInfo.name, fileInfo.content, fileInfo.path);
              addNotification('success', `Opened ${fileInfo.name}`);
              hasOpenedArgFile = true;
            } catch (err) {
              addNotification('error', `Failed to open ${filePath}: ${err}`);
            }
          }
        }

        // If no file was opened via args, try restoring session
        if (!hasOpenedArgFile) {
          const settingsState = useSettingsStore.getState().settings;
          if (settingsState.restoreLastSession) {
            try {
              const sessionDataStr = localStorage.getItem('lekh-session');
              if (sessionDataStr) {
                const sessionData = JSON.parse(sessionDataStr);
                
                // Restore folder
                if (sessionData.explorerFolder) {
                  try {
                    const entries = await invoke<any[]>('list_directory', { path: sessionData.explorerFolder });
                    useUIStore.getState().setExplorerFolder(sessionData.explorerFolder, entries);
                  } catch (e) {
                     console.error('Failed to restore folder:', e);
                  }
                }
                
                // Restore files
                if (sessionData.openedFiles && Array.isArray(sessionData.openedFiles) && sessionData.openedFiles.length > 0) {
                   useEditorStore.setState({ tabs: [], activeTabId: null });
                   
                   for (const filePath of sessionData.openedFiles) {
                      try {
                        const fileInfo = await invoke<{ name: string; content: string; path: string }>('read_file', { path: filePath });
                        const id = useEditorStore.getState().addTab(fileInfo.name, fileInfo.content, fileInfo.path);
                        if (filePath === sessionData.activeFile) {
                           useEditorStore.getState().setActiveTab(id);
                        }
                      } catch (e) {
                        console.error('Failed to restore file:', e);
                      }
                   }

                   // If all failed, ensure at least one tab exists
                   if (useEditorStore.getState().tabs.length === 0) {
                     useEditorStore.getState().addTab('Untitled.md', '');
                   }
                }
              }
            } catch (e) {
              console.error("Session restore failed", e);
            }
          }
        }

        // Listen for files opened at runtime (user double-clicks another .md while app is running)
        unlisten = await listen<string[]>('file-opened', async (event) => {
          const paths = event.payload;
          for (const filePath of paths) {
            if (/\.(md|markdown|mdx|txt)$/i.test(filePath)) {
              try {
                const fileInfo = await invoke<{ name: string; content: string; path: string }>('read_file', { path: filePath });
                addTab(fileInfo.name, fileInfo.content, fileInfo.path);
                addNotification('success', `Opened ${fileInfo.name}`);
              } catch (err) {
                addNotification('error', `Failed to open ${filePath}: ${err}`);
              }
            }
          }
        }) as unknown as () => void;
      } catch {
        // Not in Tauri environment — skip
      }
    })();

    return () => {
      if (unlisten) unlisten();
    };
  }, [addTab, addNotification]);

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const theme = settings.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.theme;
      root.setAttribute('data-theme', theme);
    };
    applyTheme();

    // Listen for system theme changes when in 'system' mode
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const systemThemeHandler = () => {
      if (settings.theme === 'system') applyTheme();
    };
    mql.addEventListener('change', systemThemeHandler);
    return () => mql.removeEventListener('change', systemThemeHandler);
  }, [settings.theme]);

  // File operations
  const handleOpenFile = useCallback(async () => {
    try {
      if (openDialog && readTextFile) {
        const filePath = await openDialog({
          filters: [
            { name: 'Markdown', extensions: ['md', 'markdown', 'mdx', 'txt'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          multiple: false,
        });

        if (filePath && typeof filePath === 'string') {
          const content = await readTextFile(filePath);
          const name = filePath.split(/[/\\]/).pop() || 'Untitled.md';
          addTab(name, content, filePath);
          addNotification('success', `Opened ${name}`);
        }
      } else {
        // Browser fallback
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.mdx,.txt';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (file) {
            const content = await file.text();
            addTab(file.name, content, null);
            addNotification('success', `Opened ${file.name}`);
          }
        };
        input.click();
      }
    } catch (err) {
      addNotification('error', `Failed to open file: ${err}`);
    }
  }, [addTab, addNotification]);

  const handleSaveFile = useCallback(async () => {
    const tab = getActiveTab();
    if (!tab) return;

    try {
      if (tab.path && writeTextFile) {
        // Save to existing path
        await writeTextFile(tab.path, tab.content);
        markTabSaved(tab.id);
        addNotification('success', `Saved ${tab.name}`);
      } else if (saveDialog && writeTextFile) {
        // Save As dialog
        let defaultPath = tab.name;
        try {
          const { join, documentDir } = await import('@tauri-apps/api/path');
          const baseDir = settings.defaultSaveLocation || await documentDir();
          defaultPath = await join(baseDir, tab.name);
        } catch {}

        const filePath = await saveDialog({
          filters: [
            { name: 'Markdown', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          defaultPath,
        });

        if (filePath) {
          await writeTextFile(filePath, tab.content);
          const name = filePath.split(/[/\\]/).pop() || tab.name;
          markTabSaved(tab.id, filePath, name);
          addNotification('success', `Saved ${name}`);
        }
      } else {
        // Browser fallback - download file
        const blob = new Blob([tab.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = tab.name;
        a.click();
        URL.revokeObjectURL(url);
        markTabSaved(tab.id);
        addNotification('success', `Downloaded ${tab.name}`);
      }
    } catch (err) {
      addNotification('error', `Failed to save: ${err}`);
    }
  }, [getActiveTab, markTabSaved, addNotification, settings.defaultSaveLocation]);

  const handleSaveAsFile = useCallback(async () => {
    const tab = getActiveTab();
    if (!tab) return;

    try {
      if (saveDialog && writeTextFile) {
        // Save As dialog
        let defaultPath = tab.path || tab.name;
        if (!tab.path) {
          try {
            const { join, documentDir } = await import('@tauri-apps/api/path');
            const baseDir = settings.defaultSaveLocation || await documentDir();
            defaultPath = await join(baseDir, tab.name);
          } catch {}
        }

        const filePath = await saveDialog({
          filters: [
            { name: 'Markdown', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          defaultPath,
        });

        if (filePath) {
          await writeTextFile(filePath, tab.content);
          const name = filePath.split(/[/\\]/).pop() || tab.name;
          markTabSaved(tab.id, filePath, name);
          addNotification('success', `Saved ${name}`);
        }
      } else {
        // Browser fallback - download file
        const blob = new Blob([tab.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = tab.name;
        a.click();
        URL.revokeObjectURL(url);
        markTabSaved(tab.id);
        addNotification('success', `Downloaded ${tab.name}`);
      }
    } catch (err) {
      addNotification('error', `Failed to save: ${err}`);
    }
  }, [getActiveTab, markTabSaved, addNotification, settings.defaultSaveLocation]);

  const handleExportHtml = useCallback(async () => {
    const tab = getActiveTab();
    if (!tab) return;

    try {
      // Import processMarkdown dynamically
      const { processMarkdown } = await import('./utils/markdown');
      const html = await processMarkdown(tab.content);
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${tab.name.replace('.md', '')}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.7; color: #e6edf3; background: #0d1117; }
pre { background: #161b22; padding: 1rem; border-radius: 8px; overflow-x: auto; }
code { font-family: 'JetBrains Mono', monospace; }
table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #30363d; padding: 8px 12px; }
blockquote { border-left: 3px solid #58a6ff; padding-left: 16px; color: #8b949e; }
img { max-width: 100%; border-radius: 8px; }
a { color: #58a6ff; }
</style>
</head>
<body>
${html}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tab.name.replace(/\.(md|markdown)$/i, '.html');
      a.click();
      URL.revokeObjectURL(url);
      addNotification('success', 'Exported as HTML');
    } catch (err) {
      addNotification('error', `Export failed: ${err}`);
    }
  }, [getActiveTab, addNotification]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Escape — close command palette
      if (e.key === 'Escape') {
        const ui = useUIStore.getState();
        if (ui.isCommandPaletteOpen) {
          e.preventDefault();
          ui.closeCommandPalette();
          return;
        }
        const ss = useSettingsStore.getState();
        if (ss.isSettingsOpen) {
          e.preventDefault();
          ss.closeSettings();
          return;
        }
        // Escape in zen mode exits zen
        if (ui.isZenMode) {
          e.preventDefault();
          ui.toggleZenMode();
          return;
        }
      }

      if (ctrl && e.key === 'p') {
        e.preventDefault();
        toggleCommandPalette();
      } else if (ctrl && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSaveAsFile();
      } else if (ctrl && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if (ctrl && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      } else if (ctrl && e.key === 'n') {
        e.preventDefault();
        addTab();
      } else if (ctrl && e.key === '1') {
        e.preventDefault();
        useUIStore.getState().setViewMode('editor');
      } else if (ctrl && e.key === '2') {
        e.preventDefault();
        useUIStore.getState().setViewMode('split');
      } else if (ctrl && e.key === '3') {
        e.preventDefault();
        useUIStore.getState().setViewMode('preview');
      } else if (ctrl && e.shiftKey && e.key === 'E') {
        // Zen mode — Ctrl+Shift+E (not Z which conflicts with redo)
        e.preventDefault();
        useUIStore.getState().toggleZenMode();
      } else if (ctrl && e.key === 'b') {
        // Toggle sidebar
        e.preventDefault();
        useUIStore.getState().toggleSidebar();
      } else if (e.altKey && e.key === 'z') {
        // Toggle word wrap
        e.preventDefault();
        const s = useSettingsStore.getState();
        s.updateSetting('wordWrap', !s.settings.wordWrap);
      } else if (ctrl && e.key === '=') {
        // Increase font size
        e.preventDefault();
        const s = useSettingsStore.getState();
        s.updateSetting('fontSize', Math.min(s.settings.fontSize + 1, 32));
      } else if (ctrl && e.key === '-') {
        // Decrease font size
        e.preventDefault();
        const s = useSettingsStore.getState();
        s.updateSetting('fontSize', Math.max(s.settings.fontSize - 1, 10));
      } else if (ctrl && e.key === ',') {
        // Open settings
        e.preventDefault();
        useSettingsStore.getState().toggleSettings();
      } else if (ctrl && e.key === 'w') {
        // Close current tab
        e.preventDefault();
        const tab = useEditorStore.getState().getActiveTab();
        if (tab) useEditorStore.getState().closeTab(tab.id);
      }
    };

    window.addEventListener('keydown', handler);

    // Custom events from toolbar/command palette
    const onSave = () => handleSaveFile();
    const onSaveAs = () => handleSaveAsFile();
    const onOpen = () => handleOpenFile();
    const onExport = () => handleExportHtml();
    window.addEventListener('md-save', onSave);
    window.addEventListener('md-save-as', onSaveAs);
    window.addEventListener('md-open', onOpen);
    window.addEventListener('md-export-html', onExport);

    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('md-save', onSave);
      window.removeEventListener('md-save-as', onSaveAs);
      window.removeEventListener('md-open', onOpen);
      window.removeEventListener('md-export-html', onExport);
    };
  }, [toggleCommandPalette, handleSaveFile, handleSaveAsFile, handleOpenFile, handleExportHtml, addTab]);

  // Session Persistence
  useEffect(() => {
    let saveTimeout: any;
    
    const syncSession = () => {
      const settingsState = useSettingsStore.getState().settings;
      if (!settingsState.restoreLastSession) return;
      
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const { tabs, activeTabId } = useEditorStore.getState();
        const { explorerFolderPath } = useUIStore.getState();
        
        const openedFiles = tabs.map(t => t.path).filter(Boolean) as string[];
        const activeTab = tabs.find(t => t.id === activeTabId);
        const activeFile = activeTab?.path || null;
        
        const sessionData = {
          openedFiles,
          activeFile,
          explorerFolder: explorerFolderPath
        };
        
        localStorage.setItem('lekh-session', JSON.stringify(sessionData));
      }, 1000);
    };

    const unsubEditor = useEditorStore.subscribe(syncSession);
    const unsubUI = useUIStore.subscribe(syncSession);
    
    return () => {
      unsubEditor();
      unsubUI();
      clearTimeout(saveTimeout);
    };
  }, []);

  // File watcher for external changes
  useEffect(() => {
    let unwatchers: Record<string, () => void> = {};
    let isWatching = true;
    let unsubscribeStore: (() => void) | null = null;

    const setupWatchers = async () => {
      try {
        const { watch, readTextFile } = await import('@tauri-apps/plugin-fs');
        
        const syncWatchers = async (state: any) => {
          if (!isWatching) return;
          const currentPaths = state.tabs.map((t: any) => t.path).filter(Boolean) as string[];
          
          for (const path of Object.keys(unwatchers)) {
            if (!currentPaths.includes(path)) {
              unwatchers[path]();
              delete unwatchers[path];
            }
          }
          
          for (const tab of state.tabs) {
            if (tab.path && unwatchers[tab.path] === undefined) {
              const pathToWatch = tab.path;
              // Prevent race conditions by marking as initializing
              unwatchers[pathToWatch] = () => {};
              try {
                const unwatch = await watch(
                  pathToWatch,
                  async (event: any) => {
                    if (!isWatching) return;
                    console.log('File watch event:', event);
                    try {
                      const currentTab = useEditorStore.getState().tabs.find(t => t.path === pathToWatch);
                      if (currentTab) {
                        let newContent = '';
                        try {
                          newContent = await readTextFile(pathToWatch);
                        } catch (err) {
                          // On Windows, the file might be temporarily locked by the other app
                          await new Promise(r => setTimeout(r, 500));
                          newContent = await readTextFile(pathToWatch);
                        }
                        if (newContent !== currentTab.content) {
                          useEditorStore.getState().updateTabContent(currentTab.id, newContent);
                          useEditorStore.getState().markTabSaved(currentTab.id);
                          useUIStore.getState().addNotification('info', `File reloaded: ${currentTab.name}`);
                        }
                      }
                    } catch (e) {
                      console.error('Failed to reload file on external change', e);
                    }
                  },
                  { delayMs: 500 }
                );
                // Update with actual unwatch function if still needed
                if (unwatchers[pathToWatch]) {
                  unwatchers[pathToWatch] = unwatch;
                } else {
                  unwatch(); // Was removed while setting up
                }
              } catch (e) {
                console.error('Failed to set up watcher for', pathToWatch, e);
                delete unwatchers[pathToWatch];
              }
            }
          }
        };

        unsubscribeStore = useEditorStore.subscribe(syncWatchers);
        // Initial sync
        syncWatchers(useEditorStore.getState());

      } catch (err) {
        // Not in Tauri or plugin not available
      }
    };

    setupWatchers();

    return () => {
      isWatching = false;
      if (unsubscribeStore) unsubscribeStore();
      Object.values(unwatchers).forEach(unwatch => unwatch());
    };
  }, []);

  // Auto-save
  useEffect(() => {
    if (!settings.autoSave) return;

    const interval = setInterval(() => {
      const tab = useEditorStore.getState().getActiveTab();
      if (tab?.isModified && tab.path && writeTextFile) {
        writeTextFile(tab.path, tab.content)
          .then(() => {
            useEditorStore.getState().markTabSaved(tab.id);
          })
          .catch(() => {
            // Silently fail auto-save
          });
      }
    }, settings.autoSaveInterval);

    return () => clearInterval(interval);
  }, [settings.autoSave, settings.autoSaveInterval]);

  // Drag and drop — enhanced with Tauri native + folder support
  useEffect(() => {
    let tauriUnlisten: (() => void) | null = null;

    // Try to set up Tauri native drag-drop listener
    (async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        const { invoke } = await import('@tauri-apps/api/core');

        tauriUnlisten = await listen<{ paths: string[] }>('tauri://drag-drop', async (event) => {
          const paths = event.payload.paths;
          for (const filePath of paths) {
            try {
              const isDir = await invoke<boolean>('is_directory', { path: filePath });
              if (isDir) {
                // Open folder in explorer
                const entries = await invoke<any[]>('list_directory', { path: filePath });
                useUIStore.getState().setExplorerFolder(filePath, entries);
                addNotification('success', `Opened folder: ${filePath.split(/[\/\\]/).pop()}`);
              } else if (/\.(md|markdown|mdx|txt)$/i.test(filePath)) {
                const fileInfo = await invoke<{ name: string; content: string; path: string }>('read_file', { path: filePath });
                addTab(fileInfo.name, fileInfo.content, fileInfo.path);
                addNotification('success', `Opened ${fileInfo.name}`);
              }
            } catch (err) {
              addNotification('error', `Failed to process dropped item: ${err}`);
            }
          }
        }) as unknown as () => void;
      } catch {
        // Not in Tauri — fall through to browser handler
      }
    })();

    // Browser fallback drag-and-drop
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();

      // If we are in Tauri, the native `tauri://drag-drop` listener handles it
      // so we should not process it again here.
      if ('__TAURI_INTERNALS__' in window) return;

      // Try webkitGetAsEntry for directory support
      const items = e.dataTransfer?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const entry = (item as any).webkitGetAsEntry?.() as FileSystemEntry | null;
          if (entry) {
            if (entry.isDirectory) {
              // Recursively read directory files in browser
              await readBrowserDirectory(entry as FileSystemDirectoryEntry);
            } else if (entry.isFile) {
              await readBrowserFileEntry(entry as FileSystemFileEntry);
            }
            continue;
          }
        }
        return;
      }

      // Fallback: plain file list
      const files = e.dataTransfer?.files;
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (/\.(md|markdown|mdx|txt)$/i.test(file.name)) {
          const content = await file.text();
          addTab(file.name, content, null);
          addNotification('success', `Opened ${file.name}`);
        }
      }
    };

    const readBrowserFileEntry = (fileEntry: FileSystemFileEntry): Promise<void> => {
      return new Promise((resolve) => {
        fileEntry.file(async (file) => {
          if (/\.(md|markdown|mdx|txt)$/i.test(file.name)) {
            const content = await file.text();
            addTab(file.name, content, null);
            addNotification('success', `Opened ${file.name}`);
          }
          resolve();
        }, () => resolve());
      });
    };

    const readBrowserDirectory = (dirEntry: FileSystemDirectoryEntry): Promise<void> => {
      return new Promise((resolve) => {
        const reader = dirEntry.createReader();
        reader.readEntries(async (entries) => {
          for (const entry of entries) {
            if (entry.isDirectory) {
              await readBrowserDirectory(entry as FileSystemDirectoryEntry);
            } else if (entry.isFile) {
              await readBrowserFileEntry(entry as FileSystemFileEntry);
            }
          }
          resolve();
        }, () => resolve());
      });
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);

    return () => {
      if (tauriUnlisten) tauriUnlisten();
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, [addTab, addNotification]);

  // Split pane resizing
  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const container = splitRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !container) return;
      const rect = container.getBoundingClientRect();
      const ratio = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(25, Math.min(75, ratio));
      useUIStore.getState().setSplitRatio(clamped);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const splitRatio = useUIStore((s) => s.splitRatio);

  return (
    <div className={`app ${isZenMode ? 'zen-mode' : ''}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {!isZenMode && isSidebarOpen && (
          <motion.div
            className="app-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="app-main">
        {/* Toolbar */}
        <AnimatePresence>
          {!isZenMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Toolbar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Bar */}
        <AnimatePresence>
          {!isZenMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <TabBar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor / Preview Area */}
        <div className="app-content" ref={splitRef}>
          {/* Editor */}
          <AnimatePresence mode="wait">
            {(viewMode === 'editor' || viewMode === 'split') && (
              <motion.div
                key="editor-pane"
                className="app-editor-pane"
                style={viewMode === 'split' ? { width: `${splitRatio}%` } : undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Editor />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resize Handle */}
          {viewMode === 'split' && (
            <div
              className="app-resize-handle"
              onMouseDown={handleSplitMouseDown}
            >
              <div className="app-resize-handle-bar" />
            </div>
          )}

          {/* Preview */}
          <AnimatePresence mode="wait">
            {(viewMode === 'preview' || viewMode === 'split') && (
              <motion.div
                key="preview-pane"
                className="app-preview-pane"
                style={viewMode === 'split' ? { width: `${100 - splitRatio}%` } : undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Preview />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <AnimatePresence>
          {!isZenMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <StatusBar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <CommandPalette />
      <Settings />
      <Notifications />
    </div>
  );
}

export default App;
