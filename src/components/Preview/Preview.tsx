// ============================================================
// Preview Component — Live Markdown Preview
// ============================================================

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { processMarkdown } from '../../utils/markdown';
import { useEditorStore } from '../../stores/editorStore';
import mermaid from 'mermaid';
import './Preview.css';

// ── Mermaid configuration ───────────────────────────────────

let mermaidInitialised = false;

function ensureMermaidInit(): void {
  if (mermaidInitialised) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    fontFamily: 'var(--font-sans)',
    securityLevel: 'loose',
    themeVariables: {
      darkMode: true,
      primaryColor: '#58a6ff',
      primaryTextColor: '#e6edf3',
      primaryBorderColor: '#30363d',
      lineColor: '#8b949e',
      secondaryColor: '#161b22',
      tertiaryColor: '#1c2128',
      background: '#0d1117',
      mainBkg: '#161b22',
      nodeBorder: '#30363d',
    },
  });
  mermaidInitialised = true;
}

// ── Public handle for scroll sync ───────────────────────────

export interface PreviewHandle {
  scrollTo: (top: number) => void;
  getScrollContainer: () => HTMLDivElement | null;
}

// ── Component ───────────────────────────────────────────────

const DEBOUNCE_MS = 200;

const Preview = forwardRef<PreviewHandle>(function Preview(_props, ref) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderIdRef = useRef<number>(0);

  // Expose scroll methods to parent via ref
  useImperativeHandle(ref, () => ({
    scrollTo: (top: number) => {
      containerRef.current?.scrollTo({ top, behavior: 'smooth' });
    },
    getScrollContainer: () => containerRef.current,
  }));

  // Get active tab content from the store
  const activeTab = useEditorStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab ?? null;
  });

  const content = activeTab?.content ?? '';

  // ── Process markdown with debounce ──────────────────────

  const processContent = useCallback(async (markdown: string, renderId: number) => {
    try {
      const result = await processMarkdown(markdown);
      // Only update if this is still the latest render
      if (renderId === renderIdRef.current) {
        setHtml(result);
        setIsLoading(false);
      }
    } catch {
      if (renderId === renderIdRef.current) {
        setHtml('<div class="markdown-error"><p>Failed to render preview.</p></div>');
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);

    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }

    const currentRenderId = ++renderIdRef.current;

    debounceTimer.current = setTimeout(() => {
      void processContent(content, currentRenderId);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content, processContent]);

  // ── Render mermaid diagrams after HTML update ─────────

  useEffect(() => {
    if (isLoading || !contentRef.current) return;

    const mermaidNodes = contentRef.current.querySelectorAll<HTMLElement>('.mermaid');
    if (mermaidNodes.length === 0) return;

    ensureMermaidInit();

    // Reset already-rendered mermaid blocks so they can be re-processed
    mermaidNodes.forEach((node) => {
      if (node.getAttribute('data-processed') === 'true') {
        node.removeAttribute('data-processed');
      }
    });

    // Use mermaid.run() to process all .mermaid elements
    mermaid.run({ nodes: mermaidNodes }).catch((err: unknown) => {
      console.warn('[Preview] Mermaid rendering error:', err);
    });
  }, [html, isLoading]);

  // ── Intercept link clicks ────────────────────────────

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Anchor links — scroll within preview
      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.slice(1);
        const target = container.querySelector(`#${CSS.escape(targetId)}`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // External links — open in default browser
      if (href.startsWith('http://') || href.startsWith('https://')) {
        e.preventDefault();
        // Use Tauri opener if available, otherwise window.open
        void import('@tauri-apps/plugin-opener')
          .then(({ openUrl }) => openUrl(href))
          .catch(() => window.open(href, '_blank'));
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [html, isLoading]);

  // ── Render ───────────────────────────────────────────

  return (
    <div className="preview-container" ref={containerRef}>
      {isLoading ? (
        <div className="preview-loading" aria-label="Loading preview">
          <div className="preview-shimmer-line preview-shimmer-line--title" />
          <div className="preview-shimmer-line preview-shimmer-line--short" />
          <div className="preview-shimmer-line" />
          <div className="preview-shimmer-line" />
          <div className="preview-shimmer-line preview-shimmer-line--medium" />
          <div className="preview-shimmer-line" />
          <div className="preview-shimmer-line preview-shimmer-line--short" />
        </div>
      ) : (
        <article
          ref={contentRef}
          className="preview-content markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
          role="document"
          aria-label="Markdown preview"
        />
      )}
    </div>
  );
});

export { Preview };
export default Preview;
