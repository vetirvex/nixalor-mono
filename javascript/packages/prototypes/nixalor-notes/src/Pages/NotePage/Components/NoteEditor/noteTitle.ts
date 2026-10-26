import { EditorSelection, Prec, StateEffect, StateField } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { Decoration, EditorView, keymap, WidgetType } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { NoteTitle } from "../NoteTitle/NoteTitle";

interface TitleState {
  name: string;
  placeholder: string;
}

interface NoteTitleOptions extends TitleState {
  onRename: (name: string) => void;
}

const setNoteTitle = StateEffect.define<TitleState>();

const TITLE_CLASS = "cm-note-title";

const focusText = (view: EditorView) => {
  view.focus();
  view.dispatch({ selection: EditorSelection.cursor(0, 1), scrollIntoView: true });
};

const mounted = new WeakMap<HTMLElement, { root: Root; observer: ResizeObserver }>();

/** The file name as an editable heading above the first line; scrolls with the text. */
class TitleWidget extends WidgetType {
  constructor(
    readonly title: TitleState,
    readonly onRename: (name: string) => void
  ) {
    super();
  }

  override eq(other: TitleWidget) {
    return (
      other.title.name === this.title.name &&
      other.title.placeholder === this.title.placeholder
    );
  }

  override toDOM(view: EditorView) {
    const dom = document.createElement("div");
    dom.className = TITLE_CLASS;
    dom.contentEditable = "false";
    const root = createRoot(dom);
    this.render(root, view);
    // Long names wrap: re-measure when the height changes.
    const observer = new ResizeObserver(() => view.requestMeasure());
    observer.observe(dom);
    mounted.set(dom, { root, observer });
    return dom;
  }

  // A rename re-renders the mounted title; a fresh widget would start empty
  // (React renders later) and the editor would measure the wrong height.
  override updateDOM(dom: HTMLElement, view: EditorView) {
    const entry = mounted.get(dom);
    if (!entry) {
      return false;
    }
    this.render(entry.root, view);
    return true;
  }

  private render(root: Root, view: EditorView) {
    root.render(
      createElement(NoteTitle, {
        // Reset the field to the new name.
        key: this.title.name,
        name: this.title.name,
        placeholder: this.title.placeholder,
        onRename: this.onRename,
        onExit: () => focusText(view),
      })
    );
  }

  override destroy(dom: HTMLElement) {
    const entry = mounted.get(dom);
    mounted.delete(dom);
    entry?.observer.disconnect();
    // CodeMirror may destroy widgets while React is rendering (e.g. a parent effect).
    queueMicrotask(() => entry?.root.unmount());
  }

  override get estimatedHeight() {
    return 56;
  }

  // The title handles its own keyboard, mouse and focus.
  override ignoreEvent() {
    return true;
  }
}

/** ↑ on the first visual line moves into the title. */
const focusTitle = (view: EditorView) => {
  const { main } = view.state.selection;
  const title = view.dom.querySelector<HTMLTextAreaElement>(`.${TITLE_CLASS} textarea`);
  const head = view.coordsAtPos(main.head);
  const start = view.coordsAtPos(0);
  if (!main.empty || !title || !head || !start || head.top - start.top > 2) {
    return false;
  }
  title.focus();
  title.setSelectionRange(title.value.length, title.value.length);
  return true;
};

const noteTitle = ({ onRename, ...initial }: NoteTitleOptions): Extension => {
  const decorate = (title: TitleState) =>
    Decoration.set(
      Decoration.widget({
        widget: new TitleWidget(title, onRename),
        block: true,
        side: -1,
      }).range(0)
    );

  const field = StateField.define<{ title: TitleState; decorations: DecorationSet }>({
    create: () => ({ title: initial, decorations: decorate(initial) }),
    update: (value, tr) => {
      for (const effect of tr.effects) {
        if (effect.is(setNoteTitle)) {
          return { title: effect.value, decorations: decorate(effect.value) };
        }
      }
      return value;
    },
    provide: (f) => EditorView.decorations.from(f, (value) => value.decorations),
  });

  return [field, Prec.high(keymap.of([{ key: "ArrowUp", run: focusTitle }]))];
};

export { noteTitle, setNoteTitle };
