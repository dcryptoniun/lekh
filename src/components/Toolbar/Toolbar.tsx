import { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bold, Italic, Strikethrough, Code, Link2, Image, List, ListOrdered,
  CheckSquare, Quote, Minus, Table, Heading1, Heading2, Heading3,
  Eye, Split, PenLine, Maximize2, Minimize2, Moon, Sun,
  Undo2, Redo2, Search, Command, Save, SaveAll
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import './Toolbar.css';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  isActive?: boolean;
  separator?: boolean;
}

function ToolbarButton({ icon, tooltip, onClick, isActive = false }: ToolbarButtonProps) {
  return (
    <motion.button
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={tooltip}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      {icon}
    </motion.button>
  );
}

function ToolbarSeparator() {
  return <div className="toolbar-separator" />;
}

/** Insert markdown syntax at cursor position in CodeMirror */
function insertMarkdown(prefix: string, suffix: string = '') {
  const cmElement = document.querySelector('.cm-content') as HTMLElement | null;
  if (!cmElement) return;

  // Get the CodeMirror view instance
  const cmView = (cmElement as any)?.cmView?.view;
  if (!cmView) {
    // Fallback: dispatch a custom event that the Editor can listen to
    window.dispatchEvent(new CustomEvent('md-insert', { detail: { prefix, suffix } }));
    return;
  }

  const { from, to } = cmView.state.selection.main;
  const selectedText = cmView.state.sliceDoc(from, to);
  const replacement = `${prefix}${selectedText}${suffix}`;

  cmView.dispatch({
    changes: { from, to, insert: replacement },
    selection: {
      anchor: from + prefix.length,
      head: from + prefix.length + selectedText.length,
    },
  });
  cmView.focus();
}

export function Toolbar() {
  const { viewMode, setViewMode, isZenMode, toggleZenMode, toggleCommandPalette } = useUIStore();
  const { settings, setTheme } = useSettingsStore();

  const isDark = settings.theme === 'dark' ||
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  // Format actions
  const handleBold = () => insertMarkdown('**', '**');
  const handleItalic = () => insertMarkdown('*', '*');
  const handleStrikethrough = () => insertMarkdown('~~', '~~');
  const handleInlineCode = () => insertMarkdown('`', '`');
  const handleLink = () => insertMarkdown('[', '](url)');
  const handleImage = () => insertMarkdown('![alt](', ')');
  const handleH1 = () => insertMarkdown('# ');
  const handleH2 = () => insertMarkdown('## ');
  const handleH3 = () => insertMarkdown('### ');
  const handleUL = () => insertMarkdown('- ');
  const handleOL = () => insertMarkdown('1. ');
  const handleTaskList = () => insertMarkdown('- [ ] ');
  const handleBlockquote = () => insertMarkdown('> ');
  const handleHR = () => insertMarkdown('\n---\n');
  const handleTable = () => insertMarkdown(
    '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n'
  );
  const handleCodeBlock = () => insertMarkdown('\n```\n', '\n```\n');

  const handleUndo = () => {
    document.querySelector('.cm-content')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
    );
  };

  const handleRedo = () => {
    document.querySelector('.cm-content')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true })
    );
  };

  const handleSave = () => {
    window.dispatchEvent(new CustomEvent('md-save'));
  };

  const handleSaveAs = () => {
    window.dispatchEvent(new CustomEvent('md-save-as'));
  };

  return (
    <motion.div
      className="toolbar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="toolbar-group">
        <ToolbarButton icon={<Save size={15} />} tooltip="Save (Ctrl+S)" onClick={handleSave} />
        <ToolbarButton icon={<SaveAll size={15} />} tooltip="Save As (Ctrl+Shift+S)" onClick={handleSaveAs} />
        <ToolbarSeparator />
        <ToolbarButton icon={<Undo2 size={15} />} tooltip="Undo (Ctrl+Z)" onClick={handleUndo} />
        <ToolbarButton icon={<Redo2 size={15} />} tooltip="Redo (Ctrl+Shift+Z)" onClick={handleRedo} />
        <ToolbarSeparator />
        <ToolbarButton icon={<Heading1 size={15} />} tooltip="Heading 1" onClick={handleH1} />
        <ToolbarButton icon={<Heading2 size={15} />} tooltip="Heading 2" onClick={handleH2} />
        <ToolbarButton icon={<Heading3 size={15} />} tooltip="Heading 3" onClick={handleH3} />
        <ToolbarSeparator />
        <ToolbarButton icon={<Bold size={15} />} tooltip="Bold (Ctrl+B)" onClick={handleBold} />
        <ToolbarButton icon={<Italic size={15} />} tooltip="Italic (Ctrl+I)" onClick={handleItalic} />
        <ToolbarButton icon={<Strikethrough size={15} />} tooltip="Strikethrough" onClick={handleStrikethrough} />
        <ToolbarButton icon={<Code size={15} />} tooltip="Inline Code" onClick={handleInlineCode} />
        <ToolbarSeparator />
        <ToolbarButton icon={<Link2 size={15} />} tooltip="Insert Link" onClick={handleLink} />
        <ToolbarButton icon={<Image size={15} />} tooltip="Insert Image" onClick={handleImage} />
        <ToolbarButton icon={<Table size={15} />} tooltip="Insert Table" onClick={handleTable} />
        <ToolbarSeparator />
        <ToolbarButton icon={<List size={15} />} tooltip="Bullet List" onClick={handleUL} />
        <ToolbarButton icon={<ListOrdered size={15} />} tooltip="Numbered List" onClick={handleOL} />
        <ToolbarButton icon={<CheckSquare size={15} />} tooltip="Task List" onClick={handleTaskList} />
        <ToolbarSeparator />
        <ToolbarButton icon={<Quote size={15} />} tooltip="Blockquote" onClick={handleBlockquote} />
        <ToolbarButton icon={<Minus size={15} />} tooltip="Horizontal Rule" onClick={handleHR} />
        <ToolbarButton icon={<Code size={15} />} tooltip="Code Block" onClick={handleCodeBlock} />
      </div>

      <div className="toolbar-group toolbar-group-right">
        <ToolbarButton
          icon={<PenLine size={15} />}
          tooltip="Editor Only"
          onClick={() => setViewMode('editor')}
          isActive={viewMode === 'editor'}
        />
        <ToolbarButton
          icon={<Split size={15} />}
          tooltip="Split View"
          onClick={() => setViewMode('split')}
          isActive={viewMode === 'split'}
        />
        <ToolbarButton
          icon={<Eye size={15} />}
          tooltip="Preview Only"
          onClick={() => setViewMode('preview')}
          isActive={viewMode === 'preview'}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={<Command size={15} />}
          tooltip="Command Palette (Ctrl+P)"
          onClick={toggleCommandPalette}
        />
        <ToolbarButton
          icon={<Search size={15} />}
          tooltip="Find (Ctrl+F)"
          onClick={() => {
            const cmContent = document.querySelector('.cm-content') as HTMLElement;
            if (cmContent) {
              cmContent.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true })
              );
            }
          }}
        />
        <ToolbarButton
          icon={isZenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          tooltip={isZenMode ? 'Exit Zen Mode' : 'Zen Mode'}
          onClick={toggleZenMode}
          isActive={isZenMode}
        />
        <ToolbarButton
          icon={isDark ? <Sun size={15} /> : <Moon size={15} />}
          tooltip={isDark ? 'Light Theme' : 'Dark Theme'}
          onClick={handleToggleTheme}
        />
      </div>
    </motion.div>
  );
}
