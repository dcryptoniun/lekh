// ============================================================
// Sidebar Component
// Icon strip + sliding panel (Explorer / Outline / Search)
// ============================================================

import React, { useMemo, useState, useCallback, type ReactNode } from 'react';
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
} from 'lucide-react';

import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { extractHeadings } from '../../utils/markdown';
import type { SidebarPanel, OutlineHeading } from '../../types';

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
  const handleOpenFolder = useCallback(() => {
    // Will be wired to Tauri's dialog API in a future iteration
    console.log('[Sidebar] Open folder requested');
  }, []);

  return (
    <>
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">Explorer</span>
      </div>
      <div className="sidebar-panel-content">
        <div className="sidebar-explorer-empty">
          <Folder size={40} className="sidebar-explorer-empty-icon" strokeWidth={1.2} />
          <p className="sidebar-explorer-empty-text">
            Open a folder to browse files
          </p>
          <button
            className="sidebar-open-folder-btn"
            onClick={handleOpenFolder}
            aria-label="Open folder"
          >
            <FolderOpen size={16} />
            Open Folder
          </button>
        </div>
      </div>
    </>
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

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Search functionality to be implemented
      console.log('[Sidebar] Search query:', query);
    },
    [query],
  );

  return (
    <>
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">Search</span>
      </div>
      <div className="sidebar-panel-content">
        <form className="sidebar-search-form" onSubmit={handleSearchSubmit}>
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
        </form>
        <p className="sidebar-search-hint">
          Type to search within the current document. Press Enter to find matches.
        </p>

        {query.trim() && (
          <div className="sidebar-search-results-empty">
            <Search size={28} className="sidebar-outline-empty-icon" strokeWidth={1.2} />
            <p className="sidebar-search-results-empty-text">
              Search results will appear here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar;
