import type { ReactNode } from "react";
import type { ItemRef } from "../../Providers/NotesProvider/NotesTypes";

interface TileProps {
  item: ItemRef;
  /** Folder color (or the folder color of the board) — tints the preview. */
  color: string;
  preview: ReactNode;
  title: string;
  meta: string;
  isFavorite: boolean;
  isSelected?: boolean;
  /** Omit to hide the selection checkbox. */
  onToggleSelect?: () => void;
  onOpen: () => void;
}

export type { TileProps };
