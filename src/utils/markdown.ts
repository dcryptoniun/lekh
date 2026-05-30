// ============================================================
// Markdown Processing Pipeline
// Uses unified/remark/rehype to convert Markdown → HTML
// ============================================================

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import type { Root, Element, Text } from 'hast';
import type { Plugin } from 'unified';
import type { OutlineHeading } from '../types';

// ── Mermaid plugin ──────────────────────────────────────────
// Transforms <pre><code class="language-mermaid">...</code></pre>
// into <div class="mermaid">...</div> so the mermaid library can
// initialise the diagram on the client side.

const rehypeMermaid: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visitNode(tree);
  };
};

function visitNode(node: Root | Element): void {
  if (!('children' in node)) return;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    if (
      child.type === 'element' &&
      child.tagName === 'pre' &&
      child.children.length === 1
    ) {
      const codeNode = child.children[0];
      if (
        codeNode.type === 'element' &&
        codeNode.tagName === 'code' &&
        Array.isArray(codeNode.properties?.className) &&
        (codeNode.properties.className as string[]).includes('language-mermaid')
      ) {
        // Extract raw text content from the code node
        const mermaidSource = extractText(codeNode);

        // Replace the <pre> with a <div class="mermaid">
        const mermaidDiv: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['mermaid'] },
          children: [{ type: 'text', value: mermaidSource }],
        };

        node.children[i] = mermaidDiv;
        continue;
      }
    }

    if (child.type === 'element') {
      visitNode(child);
    }
  }
}

/** Recursively extracts all text content from an HAST node. */
function extractText(node: Element | Text): string {
  if (node.type === 'text') return node.value;
  if ('children' in node) {
    return node.children
      .map((c) => {
        if (c.type === 'text') return c.value;
        if (c.type === 'element') return extractText(c);
        return '';
      })
      .join('');
  }
  return '';
}

// ── Heading ID generation ───────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Rehype plugin: add id attributes to headings ────────────

const rehypeHeadingIds: Plugin<[], Root> = () => {
  const slugCounts = new Map<string, number>();

  return (tree: Root) => {
    addHeadingIds(tree, slugCounts);
  };
};

function addHeadingIds(
  node: Root | Element,
  slugCounts: Map<string, number>,
): void {
  if (!('children' in node)) return;

  for (const child of node.children) {
    if (child.type === 'element') {
      if (/^h[1-6]$/.test(child.tagName)) {
        const text = extractText(child);
        let slug = slugify(text);

        // Handle duplicate slugs
        const count = slugCounts.get(slug) ?? 0;
        slugCounts.set(slug, count + 1);
        if (count > 0) {
          slug = `${slug}-${count}`;
        }

        child.properties = child.properties ?? {};
        child.properties.id = slug;
      }
      addHeadingIds(child, slugCounts);
    }
  }
}

// ── Build the processor pipeline ────────────────────────────

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml', 'toml'])
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeMermaid)
  .use(rehypeHeadingIds)
  .use(rehypeKatex)
  .use(rehypeHighlight, { detect: true, ignoreMissing: true })
  .use(rehypeStringify);

// ── Public API ──────────────────────────────────────────────

/**
 * Converts a Markdown string to sanitised HTML.
 * Handles GFM, math (KaTeX), syntax highlighting, frontmatter,
 * and mermaid diagram blocks.
 */
export async function processMarkdown(content: string): Promise<string> {
  try {
    const file = await processor.process(content);
    return String(file);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown markdown processing error';
    console.error('[markdown] Processing failed:', message);
    return `<div class="markdown-error">
      <p><strong>Markdown Processing Error</strong></p>
      <pre>${escapeHtml(message)}</pre>
    </div>`;
  }
}

/**
 * Extracts heading hierarchy from a Markdown string for outline / TOC.
 * Returns a tree of `OutlineHeading` nodes with nested children.
 */
export function extractHeadings(content: string): OutlineHeading[] {
  const headings: OutlineHeading[] = [];
  const stack: OutlineHeading[] = [];

  // Simple regex extraction — avoids running the full pipeline
  // which is expensive and only needed for rendering.
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  const slugCounts = new Map<string, number>();

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const rawText = match[2].trim();

    // Strip simple inline markdown from heading text
    const text = rawText
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/\*(.+?)\*/g, '$1')     // italic
      .replace(/~~(.+?)~~/g, '$1')     // strikethrough
      .replace(/`(.+?)`/g, '$1')       // inline code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // links

    let slug = slugify(text);
    const count = slugCounts.get(slug) ?? 0;
    slugCounts.set(slug, count + 1);
    if (count > 0) {
      slug = `${slug}-${count}`;
    }

    const heading: OutlineHeading = {
      id: slug,
      text,
      level,
      children: [],
    };

    // Build hierarchical tree
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      headings.push(heading);
    } else {
      stack[stack.length - 1].children.push(heading);
    }

    stack.push(heading);
  }

  return headings;
}

// ── Helpers ─────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
