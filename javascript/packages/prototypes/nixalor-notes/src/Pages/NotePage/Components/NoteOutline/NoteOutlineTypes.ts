import type { Heading } from "../../../../Shared/Utils/outline";

interface NoteOutlineProps {
  /** Closed = collapsed to zero width (animated like the left sidebar). */
  isOpen: boolean;
  headings: readonly Heading[];
  activeIndex: number;
  onSelect: (index: number) => void;
  title: string;
  emptyText: string;
  resizeLabel: string;
}

export type { NoteOutlineProps };
