import DOMPurify from "dompurify";
import { Marked } from "marked";
import type { TokenizerAndRendererExtension, Tokens } from "marked";
import { ATTACHMENT_PREFIX } from "./attachments";
import { parseImageAlt } from "./imageAlt";

interface WikiLinkToken extends Tokens.Generic {
  type: "wikiLink";
  target: string;
  label: string;
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const createWikiLinkExtension = (
  exists: (target: string) => boolean
): TokenizerAndRendererExtension => ({
  name: "wikiLink",
  level: "inline",
  start: (src) => src.indexOf("[["),
  tokenizer: (src) => {
    const match = /^\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/.exec(src);
    if (!match?.[1]) {
      return undefined;
    }
    const target = match[1].trim();
    return {
      type: "wikiLink",
      raw: match[0],
      target,
      label: (match[2] ?? match[1]).trim(),
    } satisfies WikiLinkToken;
  },
  renderer: (token) => {
    const { target, label } = token as WikiLinkToken;
    const missing = exists(target) ? "" : " wikilink-missing";
    return `<a href="#" class="wikilink${missing}" data-target="${escapeHtml(target)}">${escapeHtml(label)}</a>`;
  },
});

/**
 * Renders note Markdown (GFM + Obsidian wiki links) to sanitized HTML.
 * Task checkboxes are left enabled and numbered so the reader can toggle them.
 */
const renderMarkdown = (content: string, exists: (target: string) => boolean) => {
  const marked = new Marked({ gfm: true, breaks: true });
  marked.use({
    extensions: [createWikiLinkExtension(exists)],
    renderer: {
      // Embedded images get a data attribute; the reader swaps in their blob URLs.
      image: ({ href, text }) => {
        const { alt, width, align } = parseImageAlt(text);
        const size = width ? ` width="${width}"` : "";
        const source = href.startsWith(ATTACHMENT_PREFIX)
          ? `data-attachment="${escapeHtml(href.slice(ATTACHMENT_PREFIX.length))}"`
          : `src="${escapeHtml(href)}"`;
        return `<img ${source} alt="${escapeHtml(alt)}"${size} data-align="${align}">`;
      },
    },
  });
  const html = marked.parse(content, { async: false });
  const clean = DOMPurify.sanitize(html, {
    ADD_ATTR: ["data-target", "data-attachment", "data-align"],
  });

  const template = document.createElement("template");
  template.innerHTML = clean;
  template.content
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((input, index) => {
      input.removeAttribute("disabled");
      input.dataset.taskIndex = String(index);
    });
  template.content.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    if (!link.classList.contains("wikilink")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });
  return template.innerHTML;
};

const TASK_LINE = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/;
const FENCE = /^\s*(```|~~~)/;

/** Flips the n-th task checkbox in the source, skipping fenced code blocks. */
const toggleTask = (content: string, taskIndex: number) => {
  const lines = content.split("\n");
  let inFence = false;
  let seen = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    const match = !inFence && TASK_LINE.exec(line);
    if (!match) {
      continue;
    }
    if (seen === taskIndex) {
      const checked = match[2] !== " ";
      lines[i] = line.replace(TASK_LINE, `$1${checked ? " " : "x"}$3`);
      return lines.join("\n");
    }
    seen++;
  }
  return content;
};

/** First lines of a note as plain text — for thumbnails. */
const markdownToPreviewText = (content: string, maxLines = 8) =>
  content
    .split("\n")
    .filter((line) => line.trim() && !FENCE.test(line))
    .slice(0, maxLines)
    .map((line) =>
      line
        .replace(/^\s*#{1,6}\s+/, "")
        .replace(/^\s*>\s?/, "")
        .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, "☐ ")
        .replace(/^\s*[-*+]\s+/, "• ")
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
        .replace(/\[\[([^\]]+)\]\]/g, "$1")
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_~`]/g, "")
    );

export { markdownToPreviewText, renderMarkdown, toggleTask };
