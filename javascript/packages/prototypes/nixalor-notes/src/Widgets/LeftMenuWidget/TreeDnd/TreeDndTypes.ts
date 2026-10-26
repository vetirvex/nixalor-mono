interface DragItem {
  type: "folder" | "drawing";
  id: string;
}

/** Folder the dragged item would land in; `folderId: null` is the root. */
interface DropTarget {
  folderId: string | null;
}

interface TreeDndContextValue {
  dragItem: DragItem | null;
  dropTarget: DropTarget | null;
  startDrag: (item: DragItem) => void;
  endDrag: () => void;
  /** Marks `folderId` as the hovered target if the dragged item may go there. */
  hover: (folderId: string | null) => boolean;
  /** Clears the hovered target, e.g. when the pointer leaves the tree. */
  leave: () => void;
  drop: (folderId: string | null) => void;
}

export type { DragItem, DropTarget, TreeDndContextValue };
