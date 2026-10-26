import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * Colors come from CSS variables, so the editor follows the app theme and
 * accent without being reconfigured.
 */
/**
 * Horizontal space around the text column. It sits on each line (not on
 * .cm-content) because CodeMirror measures selection and cursor geometry from
 * line padding — padding on .cm-content made selections overhang the text.
 */
const GUTTER = "32px";

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "var(--text)",
    fontSize: "16px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-ui)",
    lineHeight: "1.7",
  },
  ".cm-content": {
    maxWidth: `calc(760px + 2 * ${GUTTER})`,
    margin: "0 auto",
    padding: "40px 0 40vh",
  },
  ".cm-line": { padding: `0 ${GUTTER}` },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--accent)",
    borderLeftWidth: "2px",
  },
  // Selection is drawn by CodeMirror (drawSelection) behind the text.
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground":
    { backgroundColor: "color-mix(in srgb, var(--accent) 28%, transparent)" },
  ".cm-placeholder": { color: "var(--text-faint)" },

  // Headings — sized per line, like Obsidian.
  ".cm-h1": { fontSize: "2em", lineHeight: "1.3", paddingTop: "0.4em" },
  ".cm-h2": { fontSize: "1.6em", lineHeight: "1.3", paddingTop: "0.35em" },
  ".cm-h3": { fontSize: "1.35em", paddingTop: "0.3em" },
  ".cm-h4": { fontSize: "1.15em" },
  ".cm-h5, .cm-h6": { fontSize: "1em" },

  // Blocks paint within the text column (inside the gutter) via background
  // gradients, and stay translucent so the selection behind them shows through.
  ".cm-blockquote": {
    paddingLeft: `calc(${GUTTER} + 14px) !important`,
    background: `linear-gradient(var(--accent), var(--accent)) no-repeat ${GUTTER} 0 / 3px 100%`,
    color: "var(--text-secondary)",
  },
  ".cm-codeblock": {
    padding: `0 calc(${GUTTER} + 14px) !important`,
    background: `linear-gradient(var(--code-block-bg), var(--code-block-bg)) no-repeat ${GUTTER} 0 / calc(100% - 2 * ${GUTTER}) 100%`,
    fontFamily: "ui-monospace, 'SF Mono', menlo, consolas, monospace",
    fontSize: "0.88em",
  },
  ".cm-codeblock-start": { paddingTop: "6px !important" },
  ".cm-codeblock-end": { paddingBottom: "6px !important" },
  ".cm-inline-code": {
    backgroundColor: "var(--surface-3)",
    borderRadius: "4px",
    padding: "1px 4px",
    fontFamily: "ui-monospace, 'SF Mono', menlo, consolas, monospace",
    fontSize: "0.88em",
  },

  ".cm-wikilink, .cm-md-link": {
    color: "var(--accent-soft-text)",
    textDecoration: "underline",
    textDecorationColor: "color-mix(in srgb, var(--accent) 45%, transparent)",
    textUnderlineOffset: "3px",
    cursor: "pointer",
  },
  ".cm-wikilink-missing": { opacity: "0.6", textDecorationStyle: "dashed" },
  // Images sit on their own line, aligned left / center / right — no text wrapping.
  ".cm-image": {
    display: "block",
    padding: "6px 0",
    textAlign: "center",
    lineHeight: "0",
  },
  ".cm-image[data-align=left]": { textAlign: "left" },
  ".cm-image[data-align=right]": { textAlign: "right" },
  ".cm-image-frame": {
    position: "relative",
    display: "inline-block",
    maxWidth: "100%",
    borderRadius: "8px",
  },
  ".cm-image img": {
    display: "block",
    maxWidth: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
    borderRadius: "8px",
  },
  ".cm-media-frame:hover, .cm-media-resizing .cm-media-frame": {
    outline: "2px solid color-mix(in srgb, var(--accent) 60%, transparent)",
    outlineOffset: "2px",
  },
  ".cm-media-toolbar": {
    position: "absolute",
    top: "8px",
    right: "8px",
    display: "none",
    gap: "2px",
    padding: "3px",
    border: "1px solid var(--border-dialog)",
    borderRadius: "8px",
    backgroundColor: "var(--surface-raised)",
    boxShadow: "var(--shadow-popover)",
    lineHeight: "normal",
  },
  ".cm-media-toolbar button": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    border: "none",
    borderRadius: "6px",
    background: "transparent",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  ".cm-media-toolbar button:hover:not(:disabled)": {
    backgroundColor: "var(--surface-selected)",
    color: "var(--text)",
  },
  ".cm-media-toolbar button[aria-pressed=true]": {
    backgroundColor: "var(--accent-soft-bg)",
    color: "var(--accent)",
  },
  ".cm-media-toolbar button:disabled": { opacity: "0.35", cursor: "default" },
  ".cm-media-handle": {
    position: "absolute",
    right: "6px",
    bottom: "6px",
    display: "none",
    width: "14px",
    height: "14px",
    borderRight: "3px solid var(--accent)",
    borderBottom: "3px solid var(--accent)",
    borderBottomRightRadius: "4px",
    cursor: "nwse-resize",
  },
  "[data-align=right] > .cm-media-frame > .cm-media-handle": {
    right: "auto",
    left: "6px",
    borderRight: "none",
    borderLeft: "3px solid var(--accent)",
    borderBottomRightRadius: "0",
    borderBottomLeftRadius: "4px",
    cursor: "nesw-resize",
  },
  ".cm-media-frame:hover .cm-media-toolbar, .cm-media-frame:hover .cm-media-handle, .cm-media-resizing .cm-media-handle":
    { display: "flex" },
  ".cm-image-missing": { display: "none" },
  // Heading folding: an arrow left of the heading, "…" where the section was.
  ".cm-fold-toggle": {
    position: "absolute",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "1.7em",
    marginLeft: "-26px",
    color: "var(--text-muted)",
    cursor: "pointer",
    opacity: "0",
    transition: "opacity 0.12s ease, transform 0.12s ease",
  },
  ".cm-line:hover .cm-fold-toggle, .cm-fold-toggle[data-folded=true]": { opacity: "1" },
  ".cm-fold-toggle:hover": { color: "var(--text)" },
  ".cm-fold-toggle[data-folded=true]": { transform: "rotate(-90deg)" },
  ".cm-fold-placeholder": {
    display: "inline-block",
    marginLeft: "8px",
    padding: "0 8px",
    border: "1px solid var(--border-strong)",
    borderRadius: "6px",
    backgroundColor: "var(--surface-2)",
    color: "var(--text-muted)",
    fontSize: "0.7em",
    lineHeight: "1.6",
    verticalAlign: "middle",
    cursor: "pointer",
  },
  // Embedded board preview (![[Board]]).
  ".cm-board-embed": {
    display: "block",
    padding: "6px 0",
    lineHeight: "normal",
    textAlign: "center",
  },
  ".cm-board-embed[data-align=left]": { textAlign: "left" },
  ".cm-board-embed[data-align=right]": { textAlign: "right" },
  ".cm-board-embed-frame": {
    position: "relative",
    display: "inline-flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "100%",
    verticalAlign: "top",
    textAlign: "left",
    overflow: "hidden",
    border: "1px solid var(--border-strong)",
    borderRadius: "10px",
    backgroundColor: "var(--surface-1)",
    cursor: "pointer",
  },
  ".cm-board-embed-frame:hover": { borderColor: "var(--accent)" },
  ".cm-board-embed-preview": {
    display: "flex",
    flex: "1 1 auto",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "0",
    maxHeight: "360px",
    padding: "16px",
  },
  // With an explicit height the preview takes all the room above the caption.
  ".cm-board-embed-frame[style*=height] .cm-board-embed-preview": { maxHeight: "none" },
  ".cm-board-embed-preview img": {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    filter: "var(--thumb-filter)",
  },
  ".cm-board-embed-empty": { color: "var(--text-faint)", fontSize: "13px" },
  ".cm-board-embed-caption": {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderTop: "1px solid var(--border)",
    color: "var(--text-secondary)",
    fontSize: "13px",
    fontWeight: "600",
  },
  // "/" command menu icons.
  ".cm-slash-icon": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    marginRight: "10px",
    border: "1px solid var(--border-strong)",
    borderRadius: "7px",
    color: "var(--text-secondary)",
    verticalAlign: "middle",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected] .cm-slash-icon": {
    borderColor: "var(--accent)",
    color: "var(--accent)",
  },
  ".cm-bullet": { color: "var(--text-muted)", padding: "0 6px 0 2px" },
  ".cm-hr": {
    display: "inline-block",
    width: "100%",
    verticalAlign: "middle",
    borderTop: "1px solid var(--border-strong)",
  },
  ".cm-task": {
    width: "16px",
    height: "16px",
    margin: "0 8px 0 0",
    verticalAlign: "-2px",
    accentColor: "var(--accent)",
    cursor: "pointer",
  },
  ".cm-task-done": { color: "var(--text-muted)", textDecoration: "line-through" },

  // Autocomplete popup for [[links]].
  ".cm-tooltip": {
    border: "1px solid var(--border-dialog)",
    borderRadius: "10px",
    backgroundColor: "var(--surface-raised)",
    boxShadow: "var(--shadow-popover)",
    overflow: "hidden",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily: "var(--font-ui)",
    maxHeight: "260px",
    padding: "4px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    padding: "6px 10px",
    borderRadius: "6px",
    color: "var(--text)",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--surface-selected)",
    color: "var(--text)",
  },
  ".cm-completionDetail": {
    color: "var(--text-muted)",
    fontStyle: "normal",
    marginLeft: "10px",
  },
  ".cm-completionIcon": { display: "none" },
});

const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "800", letterSpacing: "-0.01em" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--text-muted)" },
  { tag: tags.link, color: "var(--accent-soft-text)" },
  { tag: tags.url, color: "var(--text-muted)" },
  // Markup characters (#, *, `, >, -) that stay visible on the active line.
  { tag: tags.processingInstruction, color: "var(--text-faint)" },
  { tag: tags.quote, color: "var(--text-secondary)" },
  {
    tag: tags.monospace,
    fontFamily: "ui-monospace, 'SF Mono', menlo, consolas, monospace",
  },
  { tag: tags.contentSeparator, color: "var(--text-faint)" },
  // Code inside fenced blocks.
  {
    tag: [tags.keyword, tags.operatorKeyword, tags.modifier],
    color: "var(--code-keyword)",
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp],
    color: "var(--code-string)",
  },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--code-number)" },
  { tag: [tags.comment, tags.meta], color: "var(--text-muted)", fontStyle: "italic" },
  {
    tag: [tags.function(tags.variableName), tags.typeName, tags.className],
    color: "var(--code-function)",
  },
  { tag: [tags.propertyName, tags.attributeName], color: "var(--code-property)" },
]);

const editorHighlighting = syntaxHighlighting(markdownHighlight);

export { editorHighlighting, editorTheme };
