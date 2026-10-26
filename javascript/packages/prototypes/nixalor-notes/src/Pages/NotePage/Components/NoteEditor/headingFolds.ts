import {
  codeFolding,
  foldable,
  foldedRanges,
  foldEffect,
  foldState,
  syntaxTree,
  unfoldEffect,
} from "@codemirror/language";
import type { EditorState, Range, StateEffect } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType } from "@codemirror/view";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { getHeadingKey } from "../../../../Shared/Utils/outline";

const HEADING = /^ATXHeading[1-6]$/;

const CHEVRON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

/** Fold range of the heading section starting on `line`, if it's folded. */
const findFold = (state: EditorState, lineFrom: number, lineTo: number) => {
  let found: { from: number; to: number } | null = null;
  foldedRanges(state).between(lineFrom, lineTo + 1, (from, to) => {
    if (from >= lineFrom && from <= lineTo) {
      found = { from, to };
      return false;
    }
    return undefined;
  });
  return found as { from: number; to: number } | null;
};

/** Folds or unfolds the section under the heading on the line containing `pos`. */
const toggleHeadingFold = (view: EditorView, pos: number) => {
  const line = view.state.doc.lineAt(pos);
  const folded = findFold(view.state, line.from, line.to);
  if (folded) {
    view.dispatch({ effects: unfoldEffect.of(folded) });
    return;
  }
  const range = foldable(view.state, line.from, line.to);
  if (range) {
    view.dispatch({ effects: foldEffect.of(range) });
  }
};

class FoldToggleWidget extends WidgetType {
  constructor(
    private readonly folded: boolean,
    private readonly label: string
  ) {
    super();
  }

  override eq(other: FoldToggleWidget) {
    return other.folded === this.folded && other.label === this.label;
  }

  override toDOM(view: EditorView) {
    const button = document.createElement("span");
    button.className = "cm-fold-toggle";
    button.dataset.folded = String(this.folded);
    button.setAttribute("role", "button");
    button.setAttribute("aria-label", this.label);
    button.setAttribute("aria-expanded", String(!this.folded));
    button.innerHTML = CHEVRON;
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleHeadingFold(view, view.posAtDOM(button));
    });
    return button;
  }

  override ignoreEvent() {
    return true;
  }
}

const buildToggles = (view: EditorView, label: string) => {
  const decorations: Range<Decoration>[] = [];
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (!HEADING.test(node.name)) {
          return;
        }
        const line = view.state.doc.lineAt(node.from);
        // Only headings with something under them can fold.
        if (!foldable(view.state, line.from, line.to)) {
          return false;
        }
        const folded = findFold(view.state, line.from, line.to) !== null;
        decorations.push(
          Decoration.widget({
            widget: new FoldToggleWidget(folded, label),
            side: -1,
          }).range(line.from)
        );
        return false;
      },
    });
  }
  return Decoration.set(decorations, true);
};

/** Keys of the headings whose sections are currently folded. */
const getFoldedHeadingKeys = (state: EditorState) => {
  const keys: string[] = [];
  foldedRanges(state).between(0, state.doc.length, (from) => {
    const key = getHeadingKey(state.doc.lineAt(from).text);
    if (key) {
      keys.push(key);
    }
  });
  return keys;
};

/** Effects that make the folded sections match `keys` exactly. */
const foldEffectsForKeys = (state: EditorState, keys: ReadonlySet<string>) => {
  const effects: StateEffect<unknown>[] = [];
  for (let number = 1; number <= state.doc.lines; number++) {
    const line = state.doc.line(number);
    const key = getHeadingKey(line.text);
    if (!key) {
      continue;
    }
    const folded = findFold(state, line.from, line.to);
    if (keys.has(key) && !folded) {
      const range = foldable(state, line.from, line.to);
      if (range) {
        effects.push(foldEffect.of(range));
      }
    } else if (!keys.has(key) && folded) {
      effects.push(unfoldEffect.of(folded));
    }
  }
  return effects;
};

interface HeadingFoldsOptions {
  /** Tooltip of the toggle arrow (read lazily so a language switch applies). */
  getLabel: () => string;
  onFoldsChange: (keys: string[]) => void;
}

/** Obsidian-style folding of heading sections: an arrow left of each heading. */
const headingFolds = ({ getLabel, onFoldsChange }: HeadingFoldsOptions) => [
  codeFolding({
    placeholderDOM: (_view, onclick) => {
      const placeholder = document.createElement("span");
      placeholder.className = "cm-fold-placeholder";
      placeholder.textContent = "…";
      placeholder.onclick = onclick;
      return placeholder;
    },
  }),
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      // foldState is remapped on every edit; report only real changes.
      lastKeys: string;

      constructor(view: EditorView) {
        this.decorations = buildToggles(view, getLabel());
        this.lastKeys = getFoldedHeadingKeys(view.state).join("\n");
      }

      update(update: ViewUpdate) {
        const foldsChanged =
          update.startState.field(foldState, false) !==
          update.state.field(foldState, false);
        if (
          update.docChanged ||
          update.viewportChanged ||
          foldsChanged ||
          syntaxTree(update.startState) !== syntaxTree(update.state)
        ) {
          this.decorations = buildToggles(update.view, getLabel());
        }
        if (foldsChanged) {
          const keys = getFoldedHeadingKeys(update.state);
          const joined = keys.join("\n");
          if (joined !== this.lastKeys) {
            this.lastKeys = joined;
            onFoldsChange(keys);
          }
        }
      }
    },
    { decorations: (plugin) => plugin.decorations }
  ),
];

export { foldEffectsForKeys, headingFolds };
