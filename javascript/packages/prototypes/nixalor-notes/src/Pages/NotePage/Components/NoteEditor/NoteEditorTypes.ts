import type { EmbeddedBoard } from "./boardEmbedWidget";
import type { ImageLabels } from "./imageWidget";
import type { SlashLabels } from "./slashCommands";
import type { LinkTarget } from "./wikiLinkCompletion";

interface NoteEditorHandle {
  focus: () => void;
  /** Scrolls a 1-based line to the top, unfolding a section that hides it. */
  scrollToLine: (line: number) => void;
  /** Folds exactly the heading sections whose keys are given. */
  setFoldedKeys: (keys: ReadonlySet<string>) => void;
  /** Replaces the whole text (e.g. a task toggled in reading mode), keeping undo. */
  setContent: (content: string) => void;
}

interface NoteEditorProps {
  /** Pasted and dropped images are stored as this note's attachments. */
  noteId: string;
  initialContent: string;
  onChange: (content: string) => void;
  onOpenLink: (target: string) => void;
  /** Files offered after typing "[[". */
  linkTargets: readonly LinkTarget[];
  linkExists: (target: string) => boolean;
  placeholder: string;
  /** Tooltips of the image alignment / resize controls. */
  imageLabels: ImageLabels;
  foldLabel: string;
  /** Titles/hints of the "/" command menu. */
  slashLabels: SlashLabels;
  /** Board that `![[name]]` embeds, or null if the target isn't a board. */
  resolveBoard: (target: string) => EmbeddedBoard | null;
  boardEmptyText: string;
  /** Heading sections folded when the editor opens. */
  initialFoldedKeys: ReadonlySet<string>;
  onFoldsChange: (keys: string[]) => void;
  /** Topmost visible line (1-based) — drives the outline highlight. */
  onTopLineChange: (line: number) => void;
}

export type { NoteEditorHandle, NoteEditorProps };
