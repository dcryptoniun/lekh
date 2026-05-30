import { useRef, useEffect } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { buildExtensions } from './extensions';
import { getThemeExtensions } from './theme';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import './Editor.css';

interface EditorProps {
  className?: string;
}

export function Editor({ className = '' }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isUpdatingRef = useRef(false);

  const activeTab = useEditorStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab || null;
  });
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const updateTabContent = useEditorStore((s) => s.updateTabContent);
  const updateTabCursor = useEditorStore((s) => s.updateTabCursor);
  const settings = useSettingsStore((s) => s.settings);

  const isDark = settings.theme === 'dark' ||
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Create the editor view
  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = buildExtensions(settings);
    const themeExts = getThemeExtensions(isDark);

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdatingRef.current && activeTabId) {
        const content = update.state.doc.toString();
        updateTabContent(activeTabId, content);
      }
      if (update.selectionSet && activeTabId) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        updateTabCursor(activeTabId, line.number, pos - line.from + 1);
      }
    });

    const state = EditorState.create({
      doc: activeTab?.content || '',
      extensions: [...extensions, ...themeExts, updateListener],
    });

    // Destroy existing view
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // We intentionally only recreate the editor when settings or theme changes
    // Content sync is handled separately below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.lineNumbers, settings.highlightActiveLine, settings.bracketMatching,
      settings.wordWrap, settings.tabSize, settings.fontSize, isDark]);

  // Sync content when active tab changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !activeTab) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== activeTab.content) {
      isUpdatingRef.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: activeTab.content,
        },
      });
      isUpdatingRef.current = false;
    }
  }, [activeTabId, activeTab?.content]);

  // Apply font size from settings
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--cm-font-size', `${settings.fontSize}px`);
    }
  }, [settings.fontSize]);

  return (
    <div
      className={`editor-wrapper ${className}`}
      ref={containerRef}
      data-testid="editor-container"
    />
  );
}
