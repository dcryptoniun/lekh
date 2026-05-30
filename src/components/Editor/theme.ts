import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/** Dark theme for CodeMirror 6 matching our design system */
export const editorThemeDark: Extension = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--editor-bg)',
      color: 'var(--text-primary)',
      fontSize: 'var(--font-size-md)',
      fontFamily: 'var(--font-mono)',
    },
    '.cm-content': {
      caretColor: 'var(--editor-cursor)',
      padding: '8px 0',
      lineHeight: '1.7',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--editor-cursor)',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--editor-cursor)',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--editor-line-highlight)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--editor-selection) !important',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--editor-gutter)',
      color: 'var(--text-tertiary)',
      border: 'none',
      borderRight: '1px solid var(--border-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-sm)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--editor-line-highlight)',
      color: 'var(--text-secondary)',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 12px 0 8px',
      minWidth: '40px',
    },
    '.cm-foldGutter .cm-gutterElement': {
      padding: '0 4px',
      cursor: 'pointer',
      color: 'var(--text-tertiary)',
      transition: 'color 150ms',
    },
    '.cm-foldGutter .cm-gutterElement:hover': {
      color: 'var(--accent-primary)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'var(--editor-matching-bracket)',
      outline: '1px solid var(--border-accent)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(255, 200, 50, 0.25)',
      outline: '1px solid rgba(255, 200, 50, 0.5)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(255, 200, 50, 0.4)',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(88, 166, 255, 0.12)',
    },
    '.cm-tooltip': {
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li': {
        padding: '4px 8px',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: 'var(--accent-primary-bg)',
        color: 'var(--text-primary)',
      },
    },
    '.cm-panels': {
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-default)',
    },
    '.cm-panel.cm-search': {
      padding: '8px 12px',
    },
    '.cm-panel.cm-search input': {
      backgroundColor: 'var(--bg-inset)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      padding: '4px 8px',
      fontSize: 'var(--font-size-sm)',
    },
    '.cm-panel.cm-search input:focus': {
      borderColor: 'var(--accent-primary)',
      outline: 'none',
    },
    '.cm-panel.cm-search button': {
      backgroundColor: 'var(--bg-overlay)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: 'var(--font-size-sm)',
    },
    '.cm-panel.cm-search button:hover': {
      backgroundColor: 'var(--accent-primary-bg)',
      color: 'var(--text-primary)',
    },
    '.cm-panel.cm-search label': {
      color: 'var(--text-secondary)',
      fontSize: 'var(--font-size-sm)',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'var(--accent-primary-bg)',
      color: 'var(--accent-primary)',
      border: '1px solid var(--border-accent)',
      borderRadius: 'var(--radius-sm)',
      padding: '0 4px',
      margin: '0 2px',
    },
  },
  { dark: true }
);

/** Light theme for CodeMirror 6 */
export const editorThemeLight: Extension = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--editor-bg)',
      color: 'var(--text-primary)',
      fontSize: 'var(--font-size-md)',
      fontFamily: 'var(--font-mono)',
    },
    '.cm-content': {
      caretColor: 'var(--editor-cursor)',
      padding: '8px 0',
      lineHeight: '1.7',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--editor-cursor)',
      borderLeftWidth: '2px',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--editor-line-highlight)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--editor-selection) !important',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--editor-gutter)',
      color: 'var(--text-tertiary)',
      border: 'none',
      borderRight: '1px solid var(--border-muted)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--editor-line-highlight)',
      color: 'var(--text-secondary)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'var(--editor-matching-bracket)',
      outline: '1px solid var(--border-accent)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(255, 200, 50, 0.3)',
      outline: '1px solid rgba(255, 200, 50, 0.6)',
    },
    '.cm-tooltip': {
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
    },
    '.cm-panels': {
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-default)',
    },
  },
  { dark: false }
);

/** Syntax highlighting for dark theme */
export const highlightStyleDark = HighlightStyle.define([
  { tag: tags.keyword, color: '#ff7b72' },
  { tag: tags.operator, color: '#ff7b72' },
  { tag: tags.special(tags.variableName), color: '#ffa657' },
  { tag: tags.typeName, color: '#ffa657' },
  { tag: tags.atom, color: '#79c0ff' },
  { tag: tags.number, color: '#79c0ff' },
  { tag: tags.bool, color: '#79c0ff' },
  { tag: tags.definition(tags.variableName), color: '#ffa657' },
  { tag: tags.string, color: '#a5d6ff' },
  { tag: tags.special(tags.string), color: '#a5d6ff' },
  { tag: tags.comment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.variableName, color: '#ffa657' },
  { tag: tags.function(tags.variableName), color: '#d2a8ff' },
  { tag: tags.meta, color: '#8b949e' },
  { tag: tags.regexp, color: '#7ee787' },
  { tag: tags.tagName, color: '#7ee787' },
  { tag: tags.name, color: '#e6edf3' },
  { tag: tags.quote, color: '#7ee787' },
  { tag: tags.heading, color: '#79c0ff', fontWeight: 'bold' },
  { tag: tags.strong, fontWeight: 'bold', color: '#e6edf3' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#e6edf3' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#58a6ff', textDecoration: 'underline' },
  { tag: tags.url, color: '#58a6ff' },
  { tag: tags.escape, color: '#79c0ff' },
  { tag: tags.processingInstruction, color: '#8b949e' },
  { tag: tags.inserted, color: '#7ee787' },
  { tag: tags.deleted, color: '#ffa198' },
  { tag: tags.changed, color: '#ffa657' },
  { tag: tags.invalid, color: '#f85149' },
]);

/** Syntax highlighting for light theme */
export const highlightStyleLight = HighlightStyle.define([
  { tag: tags.keyword, color: '#cf222e' },
  { tag: tags.operator, color: '#cf222e' },
  { tag: tags.special(tags.variableName), color: '#953800' },
  { tag: tags.typeName, color: '#953800' },
  { tag: tags.atom, color: '#0550ae' },
  { tag: tags.number, color: '#0550ae' },
  { tag: tags.bool, color: '#0550ae' },
  { tag: tags.definition(tags.variableName), color: '#953800' },
  { tag: tags.string, color: '#0a3069' },
  { tag: tags.special(tags.string), color: '#0a3069' },
  { tag: tags.comment, color: '#6e7781', fontStyle: 'italic' },
  { tag: tags.variableName, color: '#953800' },
  { tag: tags.function(tags.variableName), color: '#8250df' },
  { tag: tags.meta, color: '#6e7781' },
  { tag: tags.regexp, color: '#116329' },
  { tag: tags.tagName, color: '#116329' },
  { tag: tags.name, color: '#1f2328' },
  { tag: tags.quote, color: '#116329' },
  { tag: tags.heading, color: '#0550ae', fontWeight: 'bold' },
  { tag: tags.strong, fontWeight: 'bold', color: '#1f2328' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#1f2328' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#0969da', textDecoration: 'underline' },
  { tag: tags.url, color: '#0969da' },
  { tag: tags.escape, color: '#0550ae' },
  { tag: tags.processingInstruction, color: '#6e7781' },
  { tag: tags.inserted, color: '#116329' },
  { tag: tags.deleted, color: '#82071e' },
  { tag: tags.changed, color: '#953800' },
  { tag: tags.invalid, color: '#cf222e' },
]);

/** Get theme extensions based on theme mode */
export function getThemeExtensions(isDark: boolean): Extension[] {
  return isDark
    ? [editorThemeDark, syntaxHighlighting(highlightStyleDark)]
    : [editorThemeLight, syntaxHighlighting(highlightStyleLight)];
}
