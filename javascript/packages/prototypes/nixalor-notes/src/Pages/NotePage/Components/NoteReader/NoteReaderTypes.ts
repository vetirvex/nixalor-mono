import type { RenderOptions } from "../../../../Shared/Utils/markdown";
import type { Heading } from "../../../../Shared/Utils/outline";

interface NoteReaderHandle {
  /** Scrolls the n-th heading (document order) to the top. */
  scrollToHeading: (index: number) => void;
}

interface NoteReaderProps {
  content: string;
  linkExists: (target: string) => boolean;
  resolveBoard: RenderOptions["resolveBoard"];
  onOpenLink: (target: string) => void;
  onToggleTask: (taskIndex: number) => void;
  emptyText: string;
  /** Headings of `content`, in the same order as the rendered ones. */
  headings: readonly Heading[];
  foldedKeys: ReadonlySet<string>;
  onToggleFold: (key: string) => void;
  foldLabel: string;
  /** Index of the heading at the top of the view — drives the outline highlight. */
  onActiveHeadingChange: (index: number) => void;
}

export type { NoteReaderHandle, NoteReaderProps };
