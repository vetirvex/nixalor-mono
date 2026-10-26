import type { Drawing, Folder } from "../../Shared/Storage/StorageTypes";

interface LeftMenuWidgetProps {}

interface NotesTree {
  foldersByParent: Map<string | null, Folder[]>;
  drawingsByFolder: Map<string | null, Drawing[]>;
  /** Boards anywhere inside each folder, nested folders included. */
  boardCounts: Map<string, number>;
}

/** Shared between tree rows: which item is being renamed right now. */
interface TreeEditingProps {
  editingId: string | null;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
}

export type { LeftMenuWidgetProps, NotesTree, TreeEditingProps };
