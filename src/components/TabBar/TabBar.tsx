import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Plus } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import './TabBar.css';

export function TabBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const addTab = useEditorStore((s) => s.addTab);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
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
              initial={{ opacity: 0, x: -12, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, width: 0, padding: 0, margin: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              layout
            >
              <FileText size={13} className="tab-icon" />
              <span className="tab-name">{tab.name}</span>
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
    </div>
  );
}
