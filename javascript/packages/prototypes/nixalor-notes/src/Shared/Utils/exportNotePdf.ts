import { getAttachmentUrl } from "./attachments";
import { getBoardPreviewUrl } from "./boardPreview";
import { highlightCodeBlocks } from "./highlightCode";
import { renderMarkdown } from "./markdown";
import type { RenderOptions } from "./markdown";

interface ExportNotePdfOptions extends RenderOptions {
  title: string;
  content: string;
  /** Accent color for quotes, links and checkboxes. */
  accent: string;
}

const FONT_TIMEOUT_MS = 2000;

/** Print stylesheet: light, A4, same typography as the reading view. */
const printStyles = (accent: string) => `
@page { size: A4; margin: 18mm 16mm 20mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  margin: 0;
  color: #16171a;
  font: 11pt/1.65 "Inter Tight", system-ui, -apple-system, "Segoe UI", roboto, sans-serif;
}
.note-title { margin: 0 0 18pt; font-size: 24pt; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
h1, h2, h3, h4, h5, h6 { margin: 1.2em 0 0.4em; font-weight: 800; line-height: 1.3; break-after: avoid; }
h1 { font-size: 20pt; } h2 { font-size: 16pt; } h3 { font-size: 13.5pt; } h4 { font-size: 12pt; }
p, ul, ol, blockquote, pre, table { margin: 0 0 0.8em; }
ul, ol { padding-left: 1.5em; }
li:has(> input[type="checkbox"]) { margin-left: -1.3em; list-style: none; }
input[type="checkbox"] { width: 11pt; height: 11pt; margin: 0 6pt 0 0; vertical-align: -1.5pt; accent-color: ${accent}; }
li:has(> input[type="checkbox"]:checked) { color: #6b6f7a; text-decoration: line-through; }
a { color: inherit; text-decoration: underline; text-decoration-color: ${accent}; text-underline-offset: 2pt; }
blockquote { margin-left: 0; padding-left: 12pt; border-left: 3pt solid ${accent}; color: #3a3d44; }
code { padding: 1pt 3pt; border-radius: 3pt; background: #f1f1ef; font-family: ui-monospace, "SF Mono", menlo, consolas, monospace; font-size: 0.88em; }
pre { position: relative; padding: 10pt 12pt; border: 1px solid #e6e6e1; border-radius: 6pt; background: #f7f7f5; white-space: pre-wrap; word-break: break-word; break-inside: avoid; }
pre code { padding: 0; background: none; }
.code-language { position: absolute; top: 4pt; right: 8pt; color: #a3a7b1; font: 600 8pt "Inter Tight", system-ui, sans-serif; }
.tok-keyword { color: #8e44ad; } .tok-string { color: #2e7d32; } .tok-number { color: #c2410c; }
.tok-comment { color: #6b6f7a; font-style: italic; } .tok-function { color: #1d4ed8; } .tok-property { color: #0e7490; }
hr { margin: 1.5em 0; border: none; border-top: 1px solid #d9d9d3; }
table { border-collapse: collapse; break-inside: avoid; }
th, td { padding: 4pt 9pt; border: 1px solid #d9d9d3; text-align: left; }
th { background: #f3f3f1; }
img { display: block; max-width: 100%; margin: 6pt auto; border-radius: 4pt; break-inside: avoid; }
img[data-align="left"] { margin-left: 0; } img[data-align="right"] { margin-right: 0; }
.board-embed-row { display: block; margin: 6pt 0 12pt; text-align: center; break-inside: avoid; }
.board-embed-row[data-align="left"] { text-align: left; } .board-embed-row[data-align="right"] { text-align: right; }
a.board-embed { display: inline-flex; flex-direction: column; width: 100%; max-width: 100%; overflow: hidden; border: 1px solid #d9d9d3; border-radius: 8pt; text-align: left; text-decoration: none; }
.board-embed-preview { display: flex; flex: 1 1 auto; align-items: center; justify-content: center; min-height: 0; padding: 12pt; }
.board-embed-preview img { max-height: 100%; margin: 0; object-fit: contain; }
.board-embed-caption { padding: 6pt 10pt; border-top: 1px solid #e6e6e1; color: #3a3d44; font-size: 9pt; font-weight: 600; }
`;

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const waitForImages = (root: ParentNode) =>
  Promise.all(
    [...root.querySelectorAll("img")].map((img) =>
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : img.decode().catch(() => undefined)
    )
  );

/**
 * Exports a note as PDF through the browser's print dialog ("Save as PDF").
 * The note is rendered into a hidden iframe with print styles, so the PDF has
 * real, selectable text (any script, no embedded fonts needed), highlighted
 * code, tables, tasks, images and board previews.
 */
const exportNoteToPdf = async ({
  title,
  content,
  accent,
  ...render
}: ExportNotePdfOptions) => {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap">
<style>${printStyles(accent)}</style></head>
<body><h1 class="note-title">${escapeHtml(title)}</h1><article>${renderMarkdown(content, render)}</article></body></html>`);
  doc.close();

  const article = doc.querySelector("article");
  if (article) {
    // Same post-processing as the reading view: embedded images, board previews, code.
    await Promise.all([
      ...[...article.querySelectorAll<HTMLImageElement>("img[data-attachment]")].map(
        async (img) => {
          const url = await getAttachmentUrl(img.dataset.attachment ?? "");
          if (url) {
            img.src = url;
          }
        }
      ),
      ...[...article.querySelectorAll<HTMLImageElement>("img[data-board-id]")].map(
        async (img) => {
          const url = await getBoardPreviewUrl(
            img.dataset.boardId ?? "",
            Number(img.dataset.boardUpdated)
          );
          if (url) {
            img.src = url;
          }
        }
      ),
      highlightCodeBlocks(article, () => false),
    ]);
    // Links can't be followed in a PDF of a local note — keep them as text.
    article
      .querySelectorAll("a.wikilink")
      .forEach((link) => link.removeAttribute("href"));
  }

  await Promise.race([
    Promise.all([doc.fonts.ready, waitForImages(doc)]),
    new Promise((resolve) => window.setTimeout(resolve, FONT_TIMEOUT_MS)),
  ]);

  const cleanup = () => window.setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", cleanup, { once: true });
  win.focus();
  win.print();
  // Some browsers don't fire afterprint for iframes; don't leave it around.
  window.setTimeout(() => iframe.isConnected && iframe.remove(), 60_000);
};

export { exportNoteToPdf };
