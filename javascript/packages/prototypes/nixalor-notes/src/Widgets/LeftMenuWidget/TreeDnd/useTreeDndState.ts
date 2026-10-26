import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotes } from "../../../Providers/NotesProvider/NotesContext";
import { getFolderSubtreeIds } from "../../../Shared/Utils/folderTree";
import type { DragItem, DropTarget, TreeDndContextValue } from "./TreeDndTypes";

/** How long to hover a collapsed folder while dragging before it opens. */
const AUTO_EXPAND_DELAY_MS = 600;

const useTreeDndState = (): TreeDndContextValue => {
  const { folders, drawings, expandedFolderIds, toggleFolder, moveFolder, moveDrawing } =
    useNotes();
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Folders the dragged folder can't go into: itself and its own subfolders.
  const blockedFolderIds = useMemo(
    () =>
      dragItem?.type === "folder"
        ? getFolderSubtreeIds(dragItem.id, folders)
        : new Set<string>(),
    [dragItem, folders]
  );

  const canDrop = useCallback(
    (folderId: string | null) => {
      if (!dragItem) {
        return false;
      }
      if (dragItem.type === "drawing") {
        return drawings.find((d) => d.id === dragItem.id)?.folderId !== folderId;
      }
      if (folderId && blockedFolderIds.has(folderId)) {
        return false;
      }
      return folders.find((f) => f.id === dragItem.id)?.parentId !== folderId;
    },
    [dragItem, drawings, folders, blockedFolderIds]
  );

  const startDrag = useCallback((item: DragItem) => setDragItem(item), []);

  const endDrag = useCallback(() => {
    setDragItem(null);
    setDropTarget(null);
  }, []);

  const hover = useCallback(
    (folderId: string | null) => {
      const allowed = canDrop(folderId);
      const next = allowed ? folderId : undefined;
      setDropTarget((prev) => {
        if (next === undefined) {
          return prev === null ? prev : null;
        }
        return prev?.folderId === next ? prev : { folderId: next };
      });
      return allowed;
    },
    [canDrop]
  );

  const leave = useCallback(() => setDropTarget(null), []);

  const drop = useCallback(
    (folderId: string | null) => {
      if (dragItem && canDrop(folderId)) {
        if (dragItem.type === "folder") {
          void moveFolder(dragItem.id, folderId);
        } else {
          void moveDrawing(dragItem.id, folderId);
        }
      }
      endDrag();
    },
    [dragItem, canDrop, moveFolder, moveDrawing, endDrag]
  );

  // Opening a collapsed folder after a short hover lets you drop deep into the tree.
  const hoveredFolderId = dropTarget?.folderId ?? null;
  const shouldAutoExpand =
    hoveredFolderId !== null && !expandedFolderIds.has(hoveredFolderId);
  useEffect(() => {
    if (!shouldAutoExpand || hoveredFolderId === null) {
      return;
    }
    const timer = window.setTimeout(
      () => toggleFolder(hoveredFolderId, true),
      AUTO_EXPAND_DELAY_MS
    );
    return () => window.clearTimeout(timer);
  }, [hoveredFolderId, shouldAutoExpand, toggleFolder]);

  return useMemo(
    () => ({ dragItem, dropTarget, startDrag, endDrag, hover, leave, drop }),
    [dragItem, dropTarget, startDrag, endDrag, hover, leave, drop]
  );
};

export { useTreeDndState };
