import { syntaxTree } from "@codemirror/language";
import { StateEffect } from "@codemirror/state";
import type { EditorState, Range } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType } from "@codemirror/view";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { parseImageAlt } from "../../../../Shared/Utils/imageAlt";
import { WIKI_LINK } from "../../../../Shared/Utils/wikiLinks";
import { ImageWidget } from "./imageWidget";
import type { ImageLabels } from "./imageWidget";

/** Lets the editor redraw link styles when the set of existing files changes. */
const refreshLinks = StateEffect.define<null>();

interface LivePreviewOptions {
  /** Whether a wiki-link target exists (missing links render dimmer). */
  linkExists: (target: string) => boolean;
  onOpenLink: (target: string) => void;
  imageLabels: ImageLabels;
}

class BulletWidget extends WidgetType {
  override eq() {
    return true;
  }

  override toDOM() {
    const span = document.createElement("span");
    span.className = "cm-bullet";
    span.textContent = "•";
    return span;
  }
}

class CheckboxWidget extends WidgetType {
  constructor(private readonly checked: boolean) {
    super();
  }

  override eq(other: CheckboxWidget) {
    return other.checked === this.checked;
  }

  override toDOM() {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "cm-task";
    input.checked = this.checked;
    return input;
  }

  // Let clicks reach the plugin's handler instead of moving the cursor.
  override ignoreEvent() {
    return false;
  }
}

class RuleWidget extends WidgetType {
  override eq() {
    return true;
  }

  override toDOM() {
    const span = document.createElement("span");
    span.className = "cm-hr";
    return span;
  }
}

const HEADING = /^ATXHeading([1-6])$/;
const hidden = Decoration.replace({});
const bullet = Decoration.replace({ widget: new BulletWidget() });
const rule = Decoration.replace({ widget: new RuleWidget() });
const inlineCode = Decoration.mark({ class: "cm-inline-code" });
const mdLink = Decoration.mark({ class: "cm-md-link" });
const taskDone = Decoration.mark({ class: "cm-task-done" });

/** Lines touched by any selection — markup is shown there, hidden elsewhere. */
const getActiveLines = (state: EditorState) => {
  const lines = new Set<number>();
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number;
    const last = state.doc.lineAt(range.to).number;
    for (let line = first; line <= last; line++) {
      lines.add(line);
    }
  }
  return lines;
};

const buildDecorations = (view: EditorView, options: LivePreviewOptions) => {
  const { state } = view;
  const decorations: Range<Decoration>[] = [];
  const active = getActiveLines(state);
  const isActive = (pos: number) => active.has(state.doc.lineAt(pos).number);
  const codeRanges: [number, number][] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name;
        const heading = HEADING.exec(name);
        if (heading) {
          const line = state.doc.lineAt(node.from);
          decorations.push(
            Decoration.line({ class: `cm-h${heading[1]}` }).range(line.from)
          );
          return;
        }
        switch (name) {
          case "HeaderMark": {
            if (!isActive(node.from)) {
              // Hide "## " including the following space.
              const end = Math.min(node.to + 1, state.doc.lineAt(node.from).to);
              decorations.push(hidden.range(node.from, end));
            }
            return;
          }
          case "EmphasisMark":
          case "StrikethroughMark": {
            if (!isActive(node.from)) {
              decorations.push(hidden.range(node.from, node.to));
            }
            return;
          }
          case "InlineCode": {
            codeRanges.push([node.from, node.to]);
            decorations.push(inlineCode.range(node.from, node.to));
            if (!isActive(node.from)) {
              const marks = node.node.getChildren("CodeMark");
              marks.forEach((mark) => decorations.push(hidden.range(mark.from, mark.to)));
            }
            return false;
          }
          case "FencedCode":
          case "CodeBlock": {
            codeRanges.push([node.from, node.to]);
            const first = state.doc.lineAt(node.from).number;
            const last = state.doc.lineAt(node.to).number;
            for (let line = first; line <= last; line++) {
              const classes = ["cm-codeblock"];
              if (line === first) {
                classes.push("cm-codeblock-start");
              }
              if (line === last) {
                classes.push("cm-codeblock-end");
              }
              decorations.push(
                Decoration.line({ class: classes.join(" ") }).range(
                  state.doc.line(line).from
                )
              );
            }
            return false;
          }
          case "Image": {
            const url = node.node.getChild("URL");
            const marks = node.node.getChildren("LinkMark");
            if (!url) {
              return false;
            }
            const altRaw =
              marks[0] && marks[1] ? state.sliceDoc(marks[0].to, marks[1].from) : "";
            const widget = new ImageWidget(
              state.sliceDoc(url.from, url.to),
              parseImageAlt(altRaw),
              options.imageLabels
            );
            // Like Obsidian: the image replaces the syntax, which shows up
            // (above the image) only while the cursor is on that line.
            decorations.push(
              isActive(node.from)
                ? Decoration.widget({ widget, side: 1 }).range(node.to)
                : Decoration.replace({ widget }).range(node.from, node.to)
            );
            return false;
          }
          case "Link": {
            const marks = node.node.getChildren("LinkMark");
            const url = node.node.getChild("URL");
            const [open, close] = marks;
            if (!open || !close || isActive(node.from)) {
              return false;
            }
            // [text](url) → show only "text" as a link.
            decorations.push(hidden.range(open.from, open.to));
            decorations.push(mdLink.range(open.to, close.from));
            decorations.push(hidden.range(close.from, node.to));
            if (url) {
              const href = state.sliceDoc(url.from, url.to);
              decorations.push(
                Decoration.mark({ attributes: { "data-href": href } }).range(
                  open.to,
                  close.from
                )
              );
            }
            return false;
          }
          case "QuoteMark": {
            const line = state.doc.lineAt(node.from);
            decorations.push(
              Decoration.line({ class: "cm-blockquote" }).range(line.from)
            );
            if (!isActive(node.from)) {
              const end = Math.min(node.to + 1, line.to);
              decorations.push(hidden.range(node.from, end));
            }
            return;
          }
          case "HorizontalRule": {
            if (!isActive(node.from)) {
              decorations.push(rule.range(node.from, node.to));
            }
            return;
          }
          case "ListMark": {
            const line = state.doc.lineAt(node.from);
            const text = state.sliceDoc(node.from, node.to);
            const isBullet = /^[-*+]$/.test(text);
            const task = node.node.parent?.getChild("Task");
            if (task) {
              // "- [ ] " → checkbox; the list mark is hidden off the active line.
              if (!isActive(node.from)) {
                decorations.push(hidden.range(node.from, Math.min(node.to + 1, line.to)));
              }
              return;
            }
            if (isBullet && !isActive(node.from)) {
              decorations.push(bullet.range(node.from, node.to));
            }
            return;
          }
          case "TaskMarker": {
            const text = state.sliceDoc(node.from, node.to);
            const checked = /x/i.test(text);
            const cursorInside = state.selection.ranges.some(
              (r) => r.from <= node.to && r.to >= node.from
            );
            if (!cursorInside) {
              decorations.push(
                Decoration.replace({ widget: new CheckboxWidget(checked) }).range(
                  node.from,
                  node.to
                )
              );
            }
            if (checked) {
              const line = state.doc.lineAt(node.from);
              const start = Math.min(node.to + 1, line.to);
              if (start < line.to) {
                decorations.push(taskDone.range(start, line.to));
              }
            }
            return;
          }
          default:
            return;
        }
      },
    });

    // Wiki links aren't part of the Markdown grammar — find them by pattern.
    const text = state.sliceDoc(from, to);
    for (const match of text.matchAll(WIKI_LINK)) {
      const start = from + (match.index ?? 0);
      const end = start + match[0].length;
      const target = (match[1] ?? "").trim();
      if (codeRanges.some(([a, b]) => start >= a && end <= b)) {
        continue;
      }
      const className = options.linkExists(target)
        ? "cm-wikilink"
        : "cm-wikilink cm-wikilink-missing";
      const mark = Decoration.mark({
        class: className,
        attributes: { "data-target": target },
      });
      if (isActive(start)) {
        decorations.push(mark.range(start + 2, end - 2));
        continue;
      }
      // [[Target|Alias]] shows "Alias"; [[Target]] shows "Target".
      const aliasOffset = match[2] !== undefined ? (match[1] ?? "").length + 1 : 0;
      decorations.push(hidden.range(start, start + 2 + aliasOffset));
      decorations.push(mark.range(start + 2 + aliasOffset, end - 2));
      decorations.push(hidden.range(end - 2, end));
    }
  }

  return Decoration.set(decorations, true);
};

/** Obsidian-style live preview: rendered text, with raw markup on the cursor line. */
const livePreview = (options: LivePreviewOptions) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, options);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet ||
          syntaxTree(update.startState) !== syntaxTree(update.state) ||
          update.transactions.some((tr) => tr.effects.some((e) => e.is(refreshLinks)))
        ) {
          this.decorations = buildDecorations(update.view, options);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
      eventHandlers: {
        mousedown: (event, view) => {
          const target = event.target as HTMLElement;

          // Toggle "[ ]" / "[x]" in the source.
          if (
            target instanceof HTMLInputElement &&
            target.classList.contains("cm-task")
          ) {
            const pos = view.posAtDOM(target);
            const marker = view.state.sliceDoc(pos, pos + 3);
            if (/^\[[ xX]\]$/.test(marker)) {
              event.preventDefault();
              view.dispatch({
                changes: {
                  from: pos + 1,
                  to: pos + 2,
                  insert: marker[1] === " " ? "x" : " ",
                },
              });
            }
            return true;
          }

          const wiki = target.closest<HTMLElement>(".cm-wikilink");
          const wikiTarget = wiki?.dataset.target;
          if (
            wikiTarget &&
            (event.metaKey || event.ctrlKey || !isLineActiveAt(view, wiki))
          ) {
            event.preventDefault();
            options.onOpenLink(wikiTarget);
            return true;
          }

          const link = target.closest<HTMLElement>("[data-href]");
          if (
            link?.dataset.href &&
            (event.metaKey || event.ctrlKey || !isLineActiveAt(view, link))
          ) {
            event.preventDefault();
            window.open(link.dataset.href, "_blank", "noopener,noreferrer");
            return true;
          }
          return false;
        },
      },
    }
  );

/** Links on the line being edited behave like text unless Cmd/Ctrl is held. */
const isLineActiveAt = (view: EditorView, element: HTMLElement | null | undefined) => {
  if (!element) {
    return false;
  }
  const pos = view.posAtDOM(element);
  return getActiveLines(view.state).has(view.state.doc.lineAt(pos).number);
};

export { livePreview, refreshLinks };
export type { LivePreviewOptions };
