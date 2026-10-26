import { memo, useMemo, useState } from "react";
import classes from "../../Pages/Shared/PageLayout.module.css";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { getFolderHex } from "../../Shared/Utils/folderColors";
import { getFolderPath } from "../../Shared/Utils/folderTree";
import { BoardsTable } from "../BoardsTable/BoardsTable";
import { BulkBar } from "../BulkBar/BulkBar";
import { FileThumbnail } from "../FileThumbnail/FileThumbnail";
import { useConfirmDelete } from "../ItemMenu/useConfirmDelete";
import { Tile } from "../Tile/Tile";
import type { BoardsSectionProps } from "./BoardsSectionTypes";

/** Boards as a table or tiles, with selection and the floating bulk-action bar. */
const BoardsSection = memo<BoardsSectionProps>(({ boards, view }) => {
  const { t, formatRelativeTime } = useI18n();
  const { folders, navigate, duplicateDrawing, downloadDrawing } = useNotes();
  const { openMove } = useLayout();
  const confirmDelete = useConfirmDelete();
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drop ids of boards that disappeared (deleted or moved out of this list).
  const selectedIds = useMemo(
    () => new Set(boards.filter((b) => selection.has(b.id)).map((b) => b.id)),
    [boards, selection]
  );
  const selectedItems = [...selectedIds].map((id) => ({
    type: "drawing" as const,
    id,
  }));

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelection(next);
  };

  return (
    <>
      {view === "list" ? (
        <BoardsTable
          boards={boards}
          selectedIds={selectedIds}
          onSelectionChange={setSelection}
          editingId={editingId}
          onEditingChange={setEditingId}
        />
      ) : (
        <div className={classes.tiles}>
          {boards.map((board) => {
            const path = getFolderPath(board.folderId, folders);
            const location = path.map((f) => f.name).join(" / ") || t("app.name");
            return (
              <Tile
                key={board.id}
                item={{ type: "drawing", id: board.id }}
                color={getFolderHex(path[path.length - 1])}
                preview={<FileThumbnail file={board} />}
                title={board.name}
                meta={`${location} · ${formatRelativeTime(board.updatedAt)}`}
                isFavorite={Boolean(board.favoritedAt)}
                isSelected={selectedIds.has(board.id)}
                onToggleSelect={() => toggle(board.id)}
                onOpen={() => navigate({ type: "drawing", id: board.id })}
              />
            );
          })}
        </div>
      )}
      {selectedIds.size > 0 && (
        <BulkBar
          count={selectedIds.size}
          onMove={() => openMove(selectedItems)}
          onDuplicate={() => {
            selectedItems.forEach((item) => void duplicateDrawing(item.id));
            setSelection(new Set());
          }}
          onDownload={() =>
            selectedItems.forEach((item) => void downloadDrawing(item.id))
          }
          onDelete={() =>
            void confirmDelete(selectedItems).then((ok) => ok && setSelection(new Set()))
          }
          onClear={() => setSelection(new Set())}
        />
      )}
    </>
  );
});
BoardsSection.displayName = "BoardsSection";

export { BoardsSection };
