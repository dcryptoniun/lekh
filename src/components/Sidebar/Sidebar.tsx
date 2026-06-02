// ============================================================
// Sidebar Component
// Icon strip + sliding panel (Explorer / Outline / Search)
// ============================================================

import React, { useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  FileText,
  List,
  Search,
  Settings,
  ChevronRight,
  ChevronDown,
  Folder,
  File as FileIcon,
  Star,
  StarOff,
  Edit2
} from 'lucide-react';

import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { extractHeadings } from '../../utils/markdown';
import type { SidebarPanel, OutlineHeading, FileEntry } from '../../types';

import './Sidebar.css';

// ── Animation variants ──────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as [number, number, number, number];

const panelVariants = {
  hidden: {
    width: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: EASE },
  },
  visible: {
    width: 'var(--sidebar-width)',
    opacity: 1,
    transition: { duration: 0.25, ease: EASE },
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: EASE },
  },
};

const contentVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, delay: 0.05, ease: EASE },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.12 },
  },
};

// ── Icon button config ──────────────────────────────────────

interface IconButtonConfig {
  panel: SidebarPanel;
  icon: ReactNode;
  label: string;
}

const ICON_BUTTONS: IconButtonConfig[] = [
  { panel: 'explorer', icon: <FolderOpen size={20} />, label: 'Explorer' },
  { panel: 'outline', icon: <List size={20} />, label: 'Outline' },
  { panel: 'search', icon: <Search size={20} />, label: 'Search' },
];

// ── Sidebar Component ───────────────────────────────────────

export function Sidebar(): React.ReactElement {
  const sidebarPanel = useUIStore((s) => s.sidebarPanel);
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setSidebarPanel = useUIStore((s) => s.setSidebarPanel);
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);

  return (
    <aside className="sidebar" aria-label="Sidebar">
      {/* ── Icon Strip ──────────────────────────────── */}
      <nav className="sidebar-icon-strip" aria-label="Sidebar navigation">
        <div className="sidebar-icon-strip-top">
          {ICON_BUTTONS.map(({ panel, icon, label }) => (
            <button
              key={panel}
              className={`sidebar-icon-btn${
                sidebarPanel === panel && isSidebarOpen ? ' active' : ''
              }`}
              onClick={() => setSidebarPanel(panel)}
              title={label}
              aria-label={label}
              aria-pressed={sidebarPanel === panel && isSidebarOpen}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="sidebar-icon-strip-bottom">
          <div className="sidebar-divider" />
          <button
            className="sidebar-icon-btn"
            onClick={toggleSettings}
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* ── Sliding Panel ───────────────────────────── */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && sidebarPanel !== null && (
          <motion.div
            key={sidebarPanel}
            className="sidebar-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ overflow: 'hidden' }}
          >
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <PanelContent panel={sidebarPanel} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

// ── Panel Content Router ────────────────────────────────────

interface PanelContentProps {
  panel: SidebarPanel;
}

function PanelContent({ panel }: PanelContentProps): React.ReactElement {
  switch (panel) {
    case 'explorer':
      return <ExplorerPanel />;
    case 'outline':
      return <OutlinePanel />;
    case 'search':
      return <SearchPanel />;
    default:
      return <ExplorerPanel />;
  }
}

// ── Explorer Panel ──────────────────────────────────────────

function ExplorerPanel(): React.ReactElement {
  const explorerFolderPath = useUIStore((s) => s.explorerFolderPath);
  const explorerEntries = useUIStore((s) => s.explorerEntries);
  const setExplorerFolder = useUIStore((s) => s.setExplorerFolder);
  const updateExplorerEntries = useUIStore((s) => s.updateExplorerEntries);
  const addTab = useEditorStore((s) => s.addTab);
  const addNotification = useUIStore((s) => s.addNotification);
  
  const { settings, addFavoriteFolder, removeFavoriteFolder } = useSettingsStore();
  const favoriteFolders = settings.favoriteFolders || [];
  
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState<boolean>(true);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry | null } | null>(null);
  const [renameState, setRenameState] = useState<{ path: string; name: string } | null>(null);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const openFolder = async (folderPath: string) => {
    try {
      setLoading(true);
      const { invoke } = await import('@tauri-apps/api/core');
      const entries = await invoke<FileEntry[]>('list_directory', { path: folderPath });
      setExplorerFolder(folderPath, entries);
      setExpandedDirs(new Set());
      setLoading(false);
      addNotification('success', `Opened folder: ${folderPath.split(/[\/\\]/).pop()}`);
    } catch (err) {
      setLoading(false);
      addNotification('error', `Failed to open folder: ${err}`);
    }
  };

  const handleOpenFolderDialog = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const folderPath = await open({ directory: true, multiple: false });
      if (folderPath && typeof folderPath === 'string') {
        await openFolder(folderPath);
      }
    } catch (err) {
      addNotification('error', `Dialog failed: ${err}`);
    }
  }, [setExplorerFolder, addNotification]);

  const handleToggleDir = useCallback(async (dirPath: string) => {
    if (renameState?.path === dirPath) return; // Don't toggle when renaming
    
    const isExpanded = expandedDirs.has(dirPath);
    if (isExpanded) {
      setExpandedDirs((prev) => {
        const next = new Set(prev);
        next.delete(dirPath);
        return next;
      });
    } else {
      setExpandedDirs((prev) => {
        const next = new Set(prev);
        next.add(dirPath);
        return next;
      });
      // Lazy-load if not already loaded
      if (!explorerEntries[dirPath]) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const entries = await invoke<FileEntry[]>('list_directory', { path: dirPath });
          updateExplorerEntries(dirPath, entries);
        } catch (err) {
          addNotification('error', `Failed to read directory: ${err}`);
        }
      }
    }
  }, [expandedDirs, explorerEntries, updateExplorerEntries, addNotification, renameState]);

  const handleFileClick = useCallback(async (entry: FileEntry) => {
    if (renameState?.path === entry.path) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const fileInfo = await invoke<{ path: string; content: string; name: string }>('read_file', { path: entry.path });
      addTab(fileInfo.name, fileInfo.content, fileInfo.path);
      addNotification('success', `Opened ${fileInfo.name}`);
    } catch (err) {
      addNotification('error', `Failed to open file: ${err}`);
    }
  }, [addTab, addNotification, renameState]);

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      entry
    });
  }, []);

  const handleRenameSubmit = async (oldPath: string, newName: string) => {
    if (!newName.trim() || newName === renameState?.name) {
      setRenameState(null);
      return;
    }
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const oldPathParts = oldPath.split(/[\/\\]/);
      oldPathParts.pop();
      const parentDir = oldPathParts.join('/');
      const newPath = `${parentDir}/${newName}`;
      
      await invoke('rename_file', { oldPath, newPath });
      
      // Refresh the parent directory
      if (explorerEntries[parentDir]) {
        const entries = await invoke<FileEntry[]>('list_directory', { path: parentDir });
        updateExplorerEntries(parentDir, entries);
      } else if (explorerFolderPath === parentDir) {
        const entries = await invoke<FileEntry[]>('list_directory', { path: parentDir });
        setExplorerFolder(parentDir, entries);
      } else {
        // If we can't find exact parent match, refresh root to be safe
        if (explorerFolderPath) {
          const entries = await invoke<FileEntry[]>('list_directory', { path: explorerFolderPath });
          setExplorerFolder(explorerFolderPath, entries);
        }
      }
      
      addNotification('success', `Renamed to ${newName}`);
    } catch (err) {
      addNotification('error', `Failed to rename: ${err}`);
    } finally {
      setRenameState(null);
    }
  };

  const folderName = explorerFolderPath ? explorerFolderPath.split(/[\/\\]/).pop() || 'Folder' : '';
  const rootEntries = explorerFolderPath ? explorerEntries[explorerFolderPath] || [] : [];
  const isCurrentFavorite = explorerFolderPath ? favoriteFolders.some(f => f.path === explorerFolderPath) : false;

  return (
    <>
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">Explorer</span>
        <button
          className="sidebar-panel-header-action"
          onClick={handleOpenFolderDialog}
          title="Open different folder"
          aria-label="Open different folder"
        >
          <FolderOpen size={14} />
        </button>
      </div>
      <div className="sidebar-panel-content">
        
        {/* Favorites Section */}
        <div className="sidebar-favorites-section">
          <div 
            className="sidebar-favorites-header"
            onClick={() => setIsFavoritesExpanded(prev => !prev)}
          >
            <span className="sidebar-tree-item-chevron">
              {isFavoritesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            <span className="sidebar-favorites-title">Favorites</span>
          </div>
          {isFavoritesExpanded && (
            <div className="sidebar-favorites-list">
              {favoriteFolders.length === 0 ? (
                <div className="sidebar-favorites-empty">No favorites yet</div>
              ) : (
                favoriteFolders.map(fav => (
                  <div 
                    key={fav.path} 
                    className={`sidebar-favorite-item ${explorerFolderPath === fav.path ? 'active' : ''}`}
                    onClick={() => openFolder(fav.path)}
                  >
                    <Star size={12} className="sidebar-favorite-icon" />
                    <span className="sidebar-favorite-name" title={fav.path}>{fav.name}</span>
                    <button 
                      className="sidebar-favorite-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavoriteFolder(fav.path);
                      }}
                      title="Remove from favorites"
                    >
                      <StarOff size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="sidebar-divider" style={{ margin: '8px 0', opacity: 0.5 }} />

        {!explorerFolderPath ? (
          <div className="sidebar-explorer-empty">
            <Folder size={40} className="sidebar-explorer-empty-icon" strokeWidth={1.2} />
            <p className="sidebar-explorer-empty-text">
              Open a folder to browse files
            </p>
            <button
              className="sidebar-open-folder-btn"
              onClick={handleOpenFolderDialog}
              aria-label="Open folder"
            >
              <FolderOpen size={16} />
              Open Folder
            </button>
          </div>
        ) : (
          <>
            <div className="sidebar-current-folder-header">
              <span className="sidebar-current-folder-name" title={explorerFolderPath}>{folderName}</span>
              <button
                className={`sidebar-current-folder-fav-btn ${isCurrentFavorite ? 'active' : ''}`}
                onClick={() => {
                  if (isCurrentFavorite) {
                    removeFavoriteFolder(explorerFolderPath);
                  } else {
                    addFavoriteFolder(explorerFolderPath, folderName);
                  }
                }}
                title={isCurrentFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                {isCurrentFavorite ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
              </button>
            </div>
            
            {loading ? (
              <div className="sidebar-explorer-loading">
                <div className="sidebar-spinner" />
                <p>Loading…</p>
              </div>
            ) : (
              <div className="sidebar-file-tree">
                {rootEntries.map((entry) => (
                  <FileTreeItem
                    key={entry.path}
                    entry={entry}
                    depth={0}
                    expandedDirs={expandedDirs}
                    explorerEntries={explorerEntries}
                    onToggleDir={handleToggleDir}
                    onFileClick={handleFileClick}
                    onContextMenu={handleContextMenu}
                    renameState={renameState}
                    onRenameSubmit={handleRenameSubmit}
                    onRenameCancel={() => setRenameState(null)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              className="sidebar-context-menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{
                position: 'fixed',
                left: contextMenu.x,
                top: contextMenu.y,
                zIndex: 1000
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="sidebar-context-menu-item"
                onClick={() => {
                  if (contextMenu.entry) {
                    setRenameState({ path: contextMenu.entry.path, name: contextMenu.entry.name });
                  }
                  setContextMenu(null);
                }}
              >
                <Edit2 size={14} />
                <span>Rename</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ── File Tree Item (recursive) ──────────────────────────────

interface FileTreeItemProps {
  entry: FileEntry;
  depth: number;
  expandedDirs: Set<string>;
  explorerEntries: Record<string, FileEntry[]>;
  onToggleDir: (path: string) => void;
  onFileClick: (entry: FileEntry) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
  renameState: { path: string; name: string } | null;
  onRenameSubmit: (oldPath: string, newName: string) => void;
  onRenameCancel: () => void;
}

function FileTreeItem({ 
  entry, depth, expandedDirs, explorerEntries, 
  onToggleDir, onFileClick, onContextMenu,
  renameState, onRenameSubmit, onRenameCancel
}: FileTreeItemProps): React.ReactElement {
  const isExpanded = expandedDirs.has(entry.path);
  const children = explorerEntries[entry.path] || [];
  const isMarkdown = /\.(md|markdown|mdx)$/i.test(entry.name);
  const isRenaming = renameState?.path === entry.path;

  const [renameInput, setRenameInput] = useState(entry.name);

  useEffect(() => {
    if (isRenaming) {
      setRenameInput(entry.name);
    }
  }, [isRenaming, entry.name]);

  const renderNameOrInput = () => {
    if (isRenaming) {
      return (
        <input
          autoFocus
          className="sidebar-rename-input"
          value={renameInput}
          onChange={(e) => setRenameInput(e.target.value)}
          onBlur={() => onRenameSubmit(entry.path, renameInput)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              onRenameSubmit(entry.path, renameInput);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              onRenameCancel();
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return <span className="sidebar-tree-item-name">{entry.name}</span>;
  };

  if (entry.is_dir) {
    return (
      <>
        <div
          className="sidebar-tree-item sidebar-tree-item--dir"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => onToggleDir(entry.path)}
          onContextMenu={(e) => onContextMenu(e, entry)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleDir(entry.path); } }}
          aria-expanded={isExpanded}
          title={entry.name}
        >
          <span className="sidebar-tree-item-chevron">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          <Folder size={14} className="sidebar-tree-item-icon sidebar-tree-item-icon--dir" />
          {renderNameOrInput()}
        </div>
        {isExpanded && children.map((child) => (
          <FileTreeItem
            key={child.path}
            entry={child}
            depth={depth + 1}
            expandedDirs={expandedDirs}
            explorerEntries={explorerEntries}
            onToggleDir={onToggleDir}
            onFileClick={onFileClick}
            onContextMenu={onContextMenu}
            renameState={renameState}
            onRenameSubmit={onRenameSubmit}
            onRenameCancel={onRenameCancel}
          />
        ))}
      </>
    );
  }

  return (
    <div
      className={`sidebar-tree-item sidebar-tree-item--file ${isMarkdown ? 'sidebar-tree-item--md' : ''}`}
      style={{ paddingLeft: `${12 + depth * 16 + 16}px` }}
      onClick={() => onFileClick(entry)}
      onContextMenu={(e) => onContextMenu(e, entry)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFileClick(entry); } }}
      title={entry.name}
    >
      {isMarkdown
        ? <FileText size={14} className="sidebar-tree-item-icon sidebar-tree-item-icon--md" />
        : <FileIcon size={14} className="sidebar-tree-item-icon" />
      }
      {renderNameOrInput()}
    </div>
  );
}

// ── Outline Panel ───────────────────────────────────────────

function OutlinePanel(): React.ReactElement {
  const getActiveTab = useEditorStore((s) => s.getActiveTab);
  const activeTab = getActiveTab();
  const content = activeTab?.content ?? '';

  const headings = useMemo(() => extractHeadings(content), [content]);

  const handleHeadingClick = useCallback((id: string) => {
    // Scroll to heading in the preview pane
    const previewEl = document.querySelector('.preview-content');
    if (previewEl) {
      const target = previewEl.querySelector(`#${CSS.escape(id)}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  const hasHeadings = headings.length > 0;

  return (
    <>
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">Outline</span>
      </div>
      <div className="sidebar-panel-content">
        {hasHeadings ? (
          <ul className="sidebar-outline-list" role="tree" aria-label="Document outline">
            <OutlineTree headings={headings} onSelect={handleHeadingClick} />
          </ul>
        ) : (
          <div className="sidebar-outline-empty">
            <FileText size={36} className="sidebar-outline-empty-icon" strokeWidth={1.2} />
            <p className="sidebar-outline-empty-text">
              {content.trim()
                ? 'No headings found in the current document.'
                : 'Start typing to see the document outline.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ── Outline Tree (recursive) ────────────────────────────────

interface OutlineTreeProps {
  headings: OutlineHeading[];
  onSelect: (id: string) => void;
}

function OutlineTree({ headings, onSelect }: OutlineTreeProps): React.ReactElement {
  return (
    <>
      {headings.map((heading) => (
        <OutlineNode key={heading.id} heading={heading} onSelect={onSelect} />
      ))}
    </>
  );
}

interface OutlineNodeProps {
  heading: OutlineHeading;
  onSelect: (id: string) => void;
}

function OutlineNode({ heading, onSelect }: OutlineNodeProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = heading.children.length > 0;

  const levelClass = `sidebar-outline-item--h${Math.min(heading.level, 6)}`;

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={`sidebar-outline-item ${levelClass}`}
        onClick={() => onSelect(heading.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(heading.id);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Go to heading: ${heading.text}`}
      >
        {hasChildren && (
          <span
            className="sidebar-outline-item-icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            role="button"
            tabIndex={-1}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
        <span className="sidebar-outline-item-text">{heading.text}</span>
      </div>

      {hasChildren && isExpanded && (
        <ul className="sidebar-outline-list" role="group">
          <OutlineTree headings={heading.children} onSelect={onSelect} />
        </ul>
      )}
    </li>
  );
}

// ── Search Panel ────────────────────────────────────────────

function SearchPanel(): React.ReactElement {
  const [query, setQuery] = useState<string>('');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const getActiveTab = useEditorStore((s) => s.getActiveTab);
  const activeTab = getActiveTab();
  const content = activeTab?.content ?? '';

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || !content) return [];

    const matches: Array<{ line: number; column: number; text: string; match: string }> = [];
    const lines = content.split('\n');

    try {
      let searchRegex: RegExp;
      if (useRegex) {
        searchRegex = new RegExp(trimmed, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchRegex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }

      for (let i = 0; i < lines.length; i++) {
        let m: RegExpExecArray | null;
        searchRegex.lastIndex = 0;
        while ((m = searchRegex.exec(lines[i])) !== null) {
          matches.push({
            line: i + 1,
            column: m.index + 1,
            text: lines[i],
            match: m[0],
          });
          if (matches.length >= 500) break; // cap results
        }
        if (matches.length >= 500) break;
      }
    } catch {
      // Invalid regex — return empty
    }

    return matches;
  }, [query, content, caseSensitive, useRegex]);

  const handleResultClick = useCallback((line: number, column: number, matchLength: number) => {
    window.dispatchEvent(new CustomEvent('md-search-goto', {
      detail: { line, column, matchLength },
    }));
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [],
  );

  return (
    <>
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">Search</span>
        {results.length > 0 && (
          <span className="sidebar-search-count">{results.length >= 500 ? '500+' : results.length} result{results.length !== 1 ? 's' : ''}</span>
        )}
      </div>
      <div className="sidebar-panel-content">
        <div className="sidebar-search-form">
          <div className="sidebar-search-input-wrapper">
            <span className="sidebar-search-input-icon">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="sidebar-search-input"
              placeholder="Search in document…"
              value={query}
              onChange={handleSearchChange}
              spellCheck={false}
              autoComplete="off"
              aria-label="Search in document"
            />
          </div>
          <div className="sidebar-search-toggles">
            <button
              className={`sidebar-search-toggle-btn ${caseSensitive ? 'active' : ''}`}
              onClick={() => setCaseSensitive((prev) => !prev)}
              title="Match Case"
              aria-label="Match Case"
              aria-pressed={caseSensitive}
            >
              Aa
            </button>
            <button
              className={`sidebar-search-toggle-btn ${useRegex ? 'active' : ''}`}
              onClick={() => setUseRegex((prev) => !prev)}
              title="Use Regular Expression"
              aria-label="Use Regular Expression"
              aria-pressed={useRegex}
            >
              .*
            </button>
          </div>
        </div>

        {query.trim() === '' && (
          <p className="sidebar-search-hint">
            Type to search within the current document.
          </p>
        )}

        {query.trim() !== '' && results.length === 0 && (
          <div className="sidebar-search-results-empty">
            <Search size={28} className="sidebar-outline-empty-icon" strokeWidth={1.2} />
            <p className="sidebar-search-results-empty-text">
              No results found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="sidebar-search-results">
            {results.map((result, idx) => {
              // Build highlighted context
              const matchStart = result.column - 1;
              const matchEnd = matchStart + result.match.length;
              const before = result.text.substring(Math.max(0, matchStart - 30), matchStart);
              const matched = result.text.substring(matchStart, matchEnd);
              const after = result.text.substring(matchEnd, matchEnd + 30);

              return (
                <div
                  key={`${result.line}-${result.column}-${idx}`}
                  className="sidebar-search-result"
                  onClick={() => handleResultClick(result.line, result.column, result.match.length)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleResultClick(result.line, result.column, result.match.length);
                    }
                  }}
                >
                  <span className="sidebar-search-result-line">{result.line}</span>
                  <span className="sidebar-search-result-context">
                    {before && <span className="sidebar-search-result-text">{before}</span>}
                    <span className="sidebar-search-result-match">{matched}</span>
                    {after && <span className="sidebar-search-result-text">{after}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar;
