import { startCompletion } from "@codemirror/autocomplete";
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { insertImages } from "./imageHandling";

type SlashCommandId =
  | "image"
  | "codeBlock"
  | "inlineCode"
  | "bulletList"
  | "numberedList"
  | "taskList"
  | "table"
  | "link"
  | "boardPreview";

interface SlashCommandLabels {
  title: string;
  hint: string;
  /** Extra words the command matches (e.g. English names). */
  keywords: string;
}

type SlashLabels = Record<SlashCommandId, SlashCommandLabels> & {
  /** Header text of inserted table columns ("Column 1", "Column 2"). */
  tableColumn: string;
};

const ORDER: SlashCommandId[] = [
  "image",
  "codeBlock",
  "inlineCode",
  "bulletList",
  "numberedList",
  "taskList",
  "table",
  "link",
  "boardPreview",
];

// Lucide-style icons for the menu (rendered by CodeMirror outside React).
const svg = (paths: string) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS: Record<SlashCommandId, string> = {
  image: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'
  ),
  codeBlock: svg('<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>'),
  inlineCode: svg(
    '<path d="M10 9.5 8 12l2 2.5M14 9.5l2 2.5-2 2.5"/><rect width="18" height="14" x="3" y="5" rx="2"/>'
  ),
  bulletList: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  numberedList: svg(
    '<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'
  ),
  taskList: svg(
    '<rect width="6" height="6" x="3" y="5" rx="1"/><path d="m3 17 2 2 4-4M13 6h8M13 12h8M13 18h8"/>'
  ),
  table: svg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M12 3v18"/>'
  ),
  link: svg(
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
  ),
  boardPreview: svg(
    '<path d="M4 17c2.5-1 3.5-5 6-5s2 3 4.5 3S18 9 20 7"/><rect width="20" height="16" x="2" y="4" rx="2"/>'
  ),
};

const pickImages = () =>
  new Promise<File[]>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.addEventListener("change", () => resolve([...(input.files ?? [])]), {
      once: true,
    });
    input.addEventListener("cancel", () => resolve([]), { once: true });
    input.click();
  });

/**
 * Replaces the typed "/command" with `text`. `cursor` is the caret offset
 * inside `text`. Block-level inserts start on their own line.
 */
const insert = (
  view: EditorView,
  from: number,
  to: number,
  text: string,
  cursor: number,
  block: boolean
) => {
  const line = view.state.doc.lineAt(from);
  const prefix =
    block && from > line.from && view.state.sliceDoc(line.from, from).trim() ? "\n" : "";
  view.dispatch({
    changes: { from, to, insert: prefix + text },
    selection: EditorSelection.cursor(from + prefix.length + cursor),
    scrollIntoView: true,
    userEvent: "input.complete",
  });
};

const createApply =
  (id: SlashCommandId, getNoteId: () => string, labels: SlashLabels) =>
  (view: EditorView, _completion: Completion, from: number, to: number) => {
    switch (id) {
      case "image": {
        view.dispatch({ changes: { from, to } });
        void pickImages().then((files) => {
          if (files.length) {
            void insertImages(view, getNoteId(), files, from);
          }
        });
        return;
      }
      case "codeBlock":
        insert(view, from, to, "```\n\n```", 4, true);
        return;
      case "inlineCode":
        insert(view, from, to, "``", 1, false);
        return;
      case "bulletList":
        insert(view, from, to, "- ", 2, true);
        return;
      case "numberedList":
        insert(view, from, to, "1. ", 3, true);
        return;
      case "taskList":
        insert(view, from, to, "- [ ] ", 6, true);
        return;
      case "table": {
        const column = labels.tableColumn;
        const header = `| ${column} 1 | ${column} 2 |`;
        const separator = "| --- | --- |";
        // Caret goes into the first body cell, after "| ".
        const cursor = header.length + 1 + separator.length + 1 + 2;
        insert(view, from, to, `${header}\n${separator}\n|  |  |`, cursor, true);
        return;
      }
      // The "/" menu is still closing here; open the file picker on the next tick.
      case "link":
        insert(view, from, to, "[[]]", 2, false);
        window.setTimeout(() => startCompletion(view));
        return;
      case "boardPreview":
        insert(view, from, to, "![[]]", 3, true);
        window.setTimeout(() => startCompletion(view));
        return;
    }
  };

const normalize = (text: string) => text.toLocaleLowerCase().replace(/\s+/g, "");

/**
 * Notion/Obsidian-style "/" menu: typed at the start of a line or after a
 * space, it offers blocks to insert (images, code, lists, tables, links, board
 * previews). Filtering matches titles and keywords in any language.
 */
const createSlashCompletion =
  (getNoteId: () => string, getLabels: () => SlashLabels) =>
  (context: CompletionContext): CompletionResult | null => {
    const match = context.matchBefore(/\/[^\s/]*$/);
    if (!match) {
      return null;
    }
    const before = context.state.sliceDoc(match.from - 1, match.from);
    if (match.from > 0 && before !== "" && !/\s/.test(before)) {
      return null; // e.g. a URL or a path, not a command
    }
    const labels = getLabels();
    const query = normalize(match.text.slice(1));
    const options: Completion[] = ORDER.filter((id) => {
      const { title, keywords } = labels[id];
      return !query || normalize(`${title} ${keywords}`).includes(query);
    }).map((id, index) => ({
      label: labels[id].title,
      detail: labels[id].hint,
      type: `slash-${id}`,
      boost: -index, // keep the menu order
      apply: createApply(id, getNoteId, labels),
    }));
    if (!options.length) {
      return null;
    }
    // Own filtering above (keywords), so CodeMirror shouldn't re-filter by label.
    return { from: match.from, options, filter: false };
  };

/** Icon column for slash commands (other completions render without icons). */
const slashIcon = {
  render: (completion: Completion) => {
    const id = completion.type?.startsWith("slash-")
      ? (completion.type.slice(6) as SlashCommandId)
      : null;
    if (!id) {
      return null;
    }
    const span = document.createElement("span");
    span.className = "cm-slash-icon";
    span.innerHTML = ICONS[id];
    return span;
  },
  position: 20,
};

export { createSlashCompletion, slashIcon };
export type { SlashLabels };
