import { EditorSelection } from "@codemirror/state";
import type { StateCommand } from "@codemirror/state";

/** Wraps each selection in `marker` (or removes it when already wrapped). */
const toggleWrap =
  (marker: string): StateCommand =>
  ({ state, dispatch }) => {
    const length = marker.length;
    const changes = state.changeByRange((range) => {
      const before = state.sliceDoc(range.from - length, range.from);
      const after = state.sliceDoc(range.to, range.to + length);
      if (before === marker && after === marker) {
        return {
          changes: [
            { from: range.from - length, to: range.from },
            { from: range.to, to: range.to + length },
          ],
          range: EditorSelection.range(range.from - length, range.to - length),
        };
      }
      return {
        changes: [
          { from: range.from, insert: marker },
          { from: range.to, insert: marker },
        ],
        range: EditorSelection.range(range.from + length, range.to + length),
      };
    });
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
    return true;
  };

const toggleBold = toggleWrap("**");
const toggleItalic = toggleWrap("*");
const toggleStrikethrough = toggleWrap("~~");
const toggleInlineCode = toggleWrap("`");

export { toggleBold, toggleInlineCode, toggleItalic, toggleStrikethrough };
