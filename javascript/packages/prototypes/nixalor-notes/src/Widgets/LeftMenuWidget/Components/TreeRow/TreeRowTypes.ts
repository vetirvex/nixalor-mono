import type { ReactNode } from "react";
import type { ItemRef } from "../../../../Providers/NotesProvider/NotesTypes";

interface TreeRowProps {
  item: ItemRef;
  /** Folder that receives items dropped on this row (null = root). */
  dropFolderId: string | null;
  depth: number;
  name: string;
  /** Color square for folders, board icon for boards. */
  leading: ReactNode;
  /** Board count shown on folders. */
  trailing?: ReactNode;
  /** Always visible, left of the hover actions (e.g. the "D" of drawings). */
  badge?: ReactNode;
  isActive?: boolean;
  isEditing: boolean;
  /** Set for folders only. */
  isExpanded?: boolean;
  onToggle?: () => void;
  onOpen: () => void;
  onStartEditing: () => void;
  onRename: (name: string) => void;
  onStopEditing: () => void;
  /** Nested rows, rendered only while the row is expanded. */
  children?: ReactNode;
}

export type { TreeRowProps };
