import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

interface LinkTarget {
  name: string;
  kind: "board" | "note";
  /** Folder path shown next to the name. */
  detail: string;
}

/**
 * Suggests file names after `[[` (boards only after `![[`, which embeds a board
 * preview). Works with auto-closed brackets: an existing `]]` isn't duplicated.
 */
const createWikiLinkCompletion =
  (getTargets: () => readonly LinkTarget[]) =>
  (context: CompletionContext): CompletionResult | null => {
    const match = context.matchBefore(/\[\[[^\]|\n]*/);
    if (!match) {
      return null;
    }
    const isEmbed = context.state.sliceDoc(match.from - 1, match.from) === "!";
    const targets = getTargets().filter((target) => !isEmbed || target.kind === "board");
    const options: Completion[] = targets.map((target) => ({
      label: target.name,
      detail: target.detail,
      apply: (view, _completion, from, to) => {
        const closed = view.state.sliceDoc(to, to + 2) === "]]";
        const insert = closed ? target.name : `${target.name}]]`;
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + target.name.length + 2 },
        });
      },
    }));
    return { from: match.from + 2, options, validFor: /^[^\]|\n]*$/ };
  };

export { createWikiLinkCompletion };
export type { LinkTarget };
