import type { Extension } from '@codemirror/state';
import { keymap, highlightActiveLine, drawSelection, dropCursor, highlightSpecialChars, rectangularSelection, crosshairCursor, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap, defaultHighlightStyle, syntaxHighlighting, indentUnit } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import type { EditorSettings } from '../../types';

/** Build the base extensions for the CodeMirror editor */
export function buildExtensions(settings: EditorSettings): Extension[] {
  const extensions: Extension[] = [
    // Core
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    highlightSelectionMatches(),
    rectangularSelection(),
    crosshairCursor(),
    autocompletion(),
    closeBrackets(),

    // Markdown language with nested language support
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    }),

    // Keymaps
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
      indentWithTab,
    ]),

    // Tab size
    indentUnit.of(' '.repeat(settings.tabSize)),

    // Placeholder
    EditorView.contentAttributes.of({
      'aria-label': 'Markdown editor',
    }),

    // Fold gutter
    foldGutter({
      openText: '▾',
      closedText: '▸',
    }),
  ];

  // Conditional extensions based on settings
  if (settings.lineNumbers) {
    extensions.push(lineNumbers());
  }

  if (settings.highlightActiveLine) {
    extensions.push(highlightActiveLine());
  }

  if (settings.bracketMatching) {
    extensions.push(bracketMatching());
  }

  if (settings.wordWrap) {
    extensions.push(EditorView.lineWrapping);
  }

  return extensions;
}
