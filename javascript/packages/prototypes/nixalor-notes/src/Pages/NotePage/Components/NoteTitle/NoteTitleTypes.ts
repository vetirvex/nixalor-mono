interface NoteTitleProps {
  /** Current file name; the field resets to it on Escape or an empty submit. */
  name: string;
  placeholder: string;
  onRename: (name: string) => void;
  /** Leaves the title for the text below (Enter, or ↓ at the end of the title). */
  onExit?: () => void;
}

export type { NoteTitleProps };
