import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

interface LinkTarget {
  name: string;
  /** Folder path shown next to the name. */
  detail: string;
}

/**
 * Suggests file names after `[[`. Works with auto-closed brackets: if `]]`
 * already follows the cursor it isn't inserted again.
 */
const createWikiLinkCompletion =
  (getTargets: () => readonly LinkTarget[]) =>
  (context: CompletionContext): CompletionResult | null => {
    const match = context.matchBefore(/\[\[[^\]|\n]*/);
    if (!match) {
      return null;
    }
    const options: Completion[] = getTargets().map((target) => ({
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
