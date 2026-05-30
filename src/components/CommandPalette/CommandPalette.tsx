import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command, FileText, Sun, Moon, Eye,
  Settings, Download, Type
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Command as CommandType } from '../../types';
import './CommandPalette.css';

export function CommandPalette() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { isCommandPaletteOpen, closeCommandPalette, setViewMode, toggleZenMode } = useUIStore();
  const { addTab } = useEditorStore();
  const { settings, setTheme, toggleSettings } = useSettingsStore();

  const isDark = settings.theme === 'dark' ||
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const commands: CommandType[] = useMemo(() => [
    {
      id: 'new-file',
      label: 'New File',
      shortcut: 'Ctrl+N',
      category: 'File',
      action: () => addTab(),
    },
    {
      id: 'save-file',
      label: 'Save File',
      shortcut: 'Ctrl+S',
      category: 'File',
      action: () => window.dispatchEvent(new CustomEvent('md-save')),
    },
    {
      id: 'open-file',
      label: 'Open File',
      shortcut: 'Ctrl+O',
      category: 'File',
      action: () => window.dispatchEvent(new CustomEvent('md-open')),
    },
    {
      id: 'export-html',
      label: 'Export as HTML',
      shortcut: '',
      category: 'Export',
      action: () => window.dispatchEvent(new CustomEvent('md-export-html')),
    },
    {
      id: 'toggle-theme',
      label: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      shortcut: '',
      category: 'Theme',
      action: () => setTheme(isDark ? 'light' : 'dark'),
    },
    {
      id: 'editor-view',
      label: 'Editor Only',
      shortcut: 'Ctrl+1',
      category: 'View',
      action: () => setViewMode('editor'),
    },
    {
      id: 'split-view',
      label: 'Split View',
      shortcut: 'Ctrl+2',
      category: 'View',
      action: () => setViewMode('split'),
    },
    {
      id: 'preview-view',
      label: 'Preview Only',
      shortcut: 'Ctrl+3',
      category: 'View',
      action: () => setViewMode('preview'),
    },
    {
      id: 'zen-mode',
      label: 'Toggle Zen Mode',
      shortcut: 'Ctrl+Shift+E',
      category: 'View',
      action: () => toggleZenMode(),
    },
    {
      id: 'settings',
      label: 'Open Settings',
      shortcut: 'Ctrl+,',
      category: 'Settings',
      action: () => toggleSettings(),
    },
    {
      id: 'increase-font',
      label: 'Increase Font Size',
      shortcut: 'Ctrl+=',
      category: 'Editor',
      action: () => {
        const { updateSetting, settings: s } = useSettingsStore.getState();
        updateSetting('fontSize', Math.min(s.fontSize + 1, 32));
      },
    },
    {
      id: 'decrease-font',
      label: 'Decrease Font Size',
      shortcut: 'Ctrl+-',
      category: 'Editor',
      action: () => {
        const { updateSetting, settings: s } = useSettingsStore.getState();
        updateSetting('fontSize', Math.max(s.fontSize - 1, 10));
      },
    },
    {
      id: 'toggle-word-wrap',
      label: 'Toggle Word Wrap',
      shortcut: 'Alt+Z',
      category: 'Editor',
      action: () => {
        const { updateSetting, settings: s } = useSettingsStore.getState();
        updateSetting('wordWrap', !s.wordWrap);
      },
    },
    {
      id: 'toggle-line-numbers',
      label: 'Toggle Line Numbers',
      shortcut: '',
      category: 'Editor',
      action: () => {
        const { updateSetting, settings: s } = useSettingsStore.getState();
        updateSetting('lineNumbers', !s.lineNumbers);
      },
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      shortcut: 'Ctrl+B',
      category: 'View',
      action: () => useUIStore.getState().toggleSidebar(),
    },
    {
      id: 'close-tab',
      label: 'Close Tab',
      shortcut: 'Ctrl+W',
      category: 'File',
      action: () => {
        const tab = useEditorStore.getState().getActiveTab();
        if (tab) useEditorStore.getState().closeTab(tab.id);
      },
    },
  ], [isDark, addTab, setTheme, setViewMode, toggleZenMode, toggleSettings]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower)
    );
  }, [query, commands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const executeCommand = useCallback((cmd: CommandType) => {
    closeCommandPalette();
    // Small delay so the palette closes smoothly before action
    requestAnimationFrame(() => cmd.action());
  }, [closeCommandPalette]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeCommandPalette();
        break;
    }
  }, [filteredCommands, selectedIndex, executeCommand, closeCommandPalette]);

  const getIcon = (category: string) => {
    switch (category) {
      case 'File': return <FileText size={14} />;
      case 'View': return <Eye size={14} />;
      case 'Theme': return isDark ? <Sun size={14} /> : <Moon size={14} />;
      case 'Settings': return <Settings size={14} />;
      case 'Export': return <Download size={14} />;
      case 'Editor': return <Type size={14} />;
      default: return <Command size={14} />;
    }
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          <motion.div
            className="command-palette-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeCommandPalette}
          />
          <motion.div
            className="command-palette"
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          >
            <div className="command-palette-input-wrapper">
              <Command size={16} className="command-palette-icon" />
              <input
                ref={inputRef}
                className="command-palette-input"
                type="text"
                placeholder="Type a command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
              />
            </div>
            <div className="command-palette-list" ref={listRef}>
              {filteredCommands.length === 0 && (
                <div className="command-palette-empty">No commands found</div>
              )}
              {filteredCommands.map((cmd, i) => (
                <motion.div
                  key={cmd.id}
                  className={`command-palette-item ${i === selectedIndex ? 'selected' : ''}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  initial={false}
                  animate={{
                    backgroundColor: i === selectedIndex ? 'var(--accent-primary-bg)' : 'transparent',
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <span className="command-palette-item-icon">{getIcon(cmd.category)}</span>
                  <span className="command-palette-item-label">{cmd.label}</span>
                  <span className="command-palette-item-category">{cmd.category}</span>
                  {cmd.shortcut && (
                    <span className="command-palette-item-shortcut">{cmd.shortcut}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
