import { create } from 'zustand';
import type { EditorTab, ContentStats } from '../types';

const WELCOME_CONTENT = `# Welcome to Lekh ✨

A beautiful, modern markdown editor built with **Tauri v2** + **React** + **CodeMirror 6**.

*Lekh (लेख) — Sanskrit for "writing"*

## Features

- 📝 **Full Markdown Support** — CommonMark + GFM
- 🎨 **Syntax Highlighting** — 100+ languages
- ➗ **Math Equations** — KaTeX powered
- 📊 **Mermaid Diagrams** — Flowcharts, sequence diagrams & more
- 🌙 **Dark/Light Themes** — Beautiful, eye-friendly
- ⌨️ **Keyboard Shortcuts** — Vim mode available
- 📁 **File Management** — Open, save, tabs
- 🔍 **Command Palette** — Quick access to everything

## Markdown Examples

### Text Formatting

This is **bold**, this is *italic*, and this is ~~strikethrough~~.

You can also use \`inline code\` and [links](https://example.com).

### Code Blocks

\`\`\`typescript
interface MarkdownEditor {
  name: string;
  features: string[];
  isAwesome: boolean;
}

const editor: MarkdownEditor = {
  name: "Lekh",
  features: ["preview", "syntax-highlight", "export"],
  isAwesome: true,
};
\`\`\`

### Task List

- [x] Build editor with CodeMirror 6
- [x] Add live preview
- [x] Implement split view
- [x] Dark/light theme
- [ ] World domination

### Table

| Feature | Status | Priority |
|---------|--------|----------|
| Editor | ✅ Done | High |
| Preview | ✅ Done | High |
| Themes | ✅ Done | Medium |
| Export | ✅ Done | Low |

### Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

### Math (KaTeX)

Inline math: $E = mc^2$

Block math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Open File] --> B{Parse Markdown}
    B --> C[Render Preview]
    B --> D[Syntax Highlight]
    C --> E[Display]
    D --> E
\`\`\`

---

*Start editing to see the live preview in action!* 🚀

---
*Made with ❤️ by Lekh*
`;

function createNewTab(name: string = 'Untitled.md', content: string = ''): EditorTab {
  return {
    id: crypto.randomUUID(),
    name,
    path: null,
    content,
    savedContent: content,
    isModified: false,
    cursorLine: 1,
    cursorCol: 1,
    scrollPos: 0,
  };
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  contentStats: ContentStats;

  // Tab management
  addTab: (name?: string, content?: string, path?: string | null) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateTabCursor: (id: string, line: number, col: number) => void;
  updateTabScroll: (id: string, pos: number) => void;
  markTabSaved: (id: string, path?: string, name?: string) => void;
  getActiveTab: () => EditorTab | null;

  // Content stats
  setContentStats: (stats: ContentStats) => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  const welcomeTab = createNewTab('Welcome.md', WELCOME_CONTENT);

  return {
    tabs: [welcomeTab],
    activeTabId: welcomeTab.id,
    contentStats: { words: 0, characters: 0, lines: 0, paragraphs: 0 },

    addTab: (name?: string, content?: string, path?: string | null) => {
      const tab = createNewTab(name || 'Untitled.md', content || '');
      if (path !== undefined) {
        tab.path = path ?? null;
        tab.savedContent = content || '';
      }
      set((state) => ({
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      }));
      return tab.id;
    },

    closeTab: (id: string) => {
      set((state) => {
        const newTabs = state.tabs.filter((t) => t.id !== id);
        if (newTabs.length === 0) {
          const fresh = createNewTab();
          return { tabs: [fresh], activeTabId: fresh.id };
        }
        let newActiveId = state.activeTabId;
        if (state.activeTabId === id) {
          const idx = state.tabs.findIndex((t) => t.id === id);
          const nextIdx = Math.min(idx, newTabs.length - 1);
          newActiveId = newTabs[nextIdx].id;
        }
        return { tabs: newTabs, activeTabId: newActiveId };
      });
    },

    setActiveTab: (id: string) => set({ activeTabId: id }),

    updateTabContent: (id: string, content: string) => {
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id
            ? { ...t, content, isModified: content !== t.savedContent }
            : t
        ),
      }));
    },

    updateTabCursor: (id: string, line: number, col: number) => {
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id ? { ...t, cursorLine: line, cursorCol: col } : t
        ),
      }));
    },

    updateTabScroll: (id: string, pos: number) => {
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id ? { ...t, scrollPos: pos } : t
        ),
      }));
    },

    markTabSaved: (id: string, path?: string, name?: string) => {
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id
            ? {
                ...t,
                savedContent: t.content,
                isModified: false,
                ...(path !== undefined && { path }),
                ...(name !== undefined && { name }),
              }
            : t
        ),
      }));
    },

    getActiveTab: () => {
      const state = get();
      return state.tabs.find((t) => t.id === state.activeTabId) || null;
    },

    setContentStats: (stats: ContentStats) => set({ contentStats: stats }),
  };
});
