import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Type, Hash, AlignLeft, Clock } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import './StatusBar.css';

export function StatusBar() {
  const activeTab = useEditorStore((s) => {
    return s.tabs.find((t) => t.id === s.activeTabId) || null;
  });
  const viewMode = useUIStore((s) => s.viewMode);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d: Date): string => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Count words from active tab content for instant feedback
  const wordCount = activeTab?.content
    ? activeTab.content.split(/\s+/).filter((w) => w.length > 0).length
    : 0;
  const charCount = activeTab?.content?.length || 0;
  const lineCount = activeTab?.content
    ? activeTab.content.split('\n').length
    : 0;

  return (
    <motion.div
      className="statusbar"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="statusbar-left">
        <div className="statusbar-item" title="File">
          <FileText size={12} />
          <span>{activeTab?.name || 'No file'}</span>
        </div>
        {activeTab?.isModified && (
          <motion.span
            className="statusbar-modified"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            Modified
          </motion.span>
        )}
      </div>

      <div className="statusbar-center">
        <div className="statusbar-item" title="Words">
          <Type size={12} />
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div className="statusbar-item" title="Characters">
          <Hash size={12} />
          <span>{charCount.toLocaleString()} chars</span>
        </div>
        <div className="statusbar-item" title="Lines">
          <AlignLeft size={12} />
          <span>{lineCount.toLocaleString()} lines</span>
        </div>
      </div>

      <div className="statusbar-right">
        <div className="statusbar-item">
          <span>Ln {activeTab?.cursorLine || 1}, Col {activeTab?.cursorCol || 1}</span>
        </div>
        <div className="statusbar-item">
          <span className="statusbar-mode">{viewMode.toUpperCase()}</span>
        </div>
        <div className="statusbar-item">
          <span>Markdown</span>
        </div>
        <div className="statusbar-item">
          <span>UTF-8</span>
        </div>
        <div className="statusbar-item statusbar-time">
          <Clock size={12} />
          <span>{formatTime(time)}</span>
        </div>
      </div>
    </motion.div>
  );
}
