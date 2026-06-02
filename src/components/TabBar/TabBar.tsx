import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Plus, Edit2 } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import './TabBar.css';

export function TabBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const addTab = useEditorStore((s) => s.addTab);
  const renameTab = useEditorStore((s) => s.renameTab);
  
  const addNotification = useUIStore((s) => s.addNotification);
  const updateExplorerEntries = useUIStore((s) => s.updateExplorerEntries);
  const setExplorerFolder = useUIStore((s) => s.setExplorerFolder);
  const explorerFolderPath = useUIStore((s) => s.explorerFolderPath);
  const explorerEntries = useUIStore((s) => s.explorerEntries);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [renameState, setRenameState] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const handleRenameSubmit = async (tabId: string, newName: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !newName.trim() || newName === tab.name) {
      setRenameState(null);
      return;
    }
    
    try {
      if (tab.path) {
        // It's a saved file, rename on disk
        const { invoke } = await import('@tauri-apps/api/core');
        const oldPath = tab.path;
        const oldPathParts = oldPath.split(/[\/\\]/);
        oldPathParts.pop();
        const parentDir = oldPathParts.join('/');
        const newPath = `${parentDir}/${newName}`;
        
        await invoke('rename_file', { oldPath, newPath });
        
        renameTab(tabId, newPath, newName);
        
        // Refresh explorer if needed
        if (explorerEntries[parentDir]) {
          const entries = await invoke<any[]>('list_directory', { path: parentDir });
          updateExplorerEntries(parentDir, entries);
        } else if (explorerFolderPath === parentDir) {
          const entries = await invoke<any[]>('list_directory', { path: parentDir });
          setExplorerFolder(parentDir, entries);
        } else if (explorerFolderPath) {
          const entries = await invoke<any[]>('list_directory', { path: explorerFolderPath });
          setExplorerFolder(explorerFolderPath, entries);
        }
        
        addNotification('success', `Renamed to ${newName}`);
      } else {
        // Unsved file, just update name in store
        renameTab(tabId, tab.path || '', newName);
      }
    } catch (err) {
      addNotification('error', `Failed to rename: ${err}`);
    } finally {
      setRenameState(null);
    }
  };

  return (
    <div className="tabbar">
      <div className="tabbar-tabs">
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              initial={{ opacity: 0, x: -12, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, width: 0, padding: 0, margin: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              layout
            >
              <FileText size={13} className="tab-icon" />
              {renameState?.id === tab.id ? (
                <input
                  autoFocus
                  className="tab-rename-input"
                  value={renameState.name}
                  onChange={(e) => setRenameState({ ...renameState, name: e.target.value })}
                  onBlur={() => handleRenameSubmit(tab.id, renameState.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRenameSubmit(tab.id, renameState.name);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      setRenameState(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="tab-name" title={tab.path || tab.name}>{tab.name}</span>
              )}
              {tab.isModified && <span className="tab-modified" title="Unsaved changes" />}
              <motion.button
                className="tab-close"
                onClick={(e) => handleCloseTab(e, tab.id)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
              >
                <X size={12} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <motion.button
        className="tabbar-new"
        onClick={() => addTab()}
        title="New Tab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Plus size={15} />
      </motion.button>

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
                const tab = tabs.find(t => t.id === contextMenu.tabId);
                if (tab) {
                  setRenameState({ id: tab.id, name: tab.name });
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
  );
}
