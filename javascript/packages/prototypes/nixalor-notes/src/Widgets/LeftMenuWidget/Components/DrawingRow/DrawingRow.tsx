import { memo } from "react";
import { useNotes } from "../../../../Providers/NotesProvider/NotesContext";
import { BoardIcon, NoteIcon } from "../../../../Shared/Icons/Icons";
import { getFileKind } from "../../../../Shared/Storage/StorageTypes";
import { TreeRow } from "../TreeRow/TreeRow";
import type { DrawingRowProps } from "./DrawingRowTypes";

const DrawingRow = memo<DrawingRowProps>(
  ({ drawing, depth, editingId, onStartEditing, onStopEditing }) => {
    const { activeDrawingId, navigate, renameDrawing } = useNotes();

    return (
      <TreeRow
        item={{ type: "drawing", id: drawing.id }}
        dropFolderId={drawing.folderId}
        depth={depth}
        name={drawing.name}
        leading={
          getFileKind(drawing) === "note" ? (
            <NoteIcon size={14} />
          ) : (
            <BoardIcon size={14} />
          )
        }
        isActive={activeDrawingId === drawing.id}
        isEditing={editingId === drawing.id}
        onOpen={() => navigate({ type: "drawing", id: drawing.id })}
        onStartEditing={() => onStartEditing(drawing.id)}
        onRename={(name) => void renameDrawing(drawing.id, name)}
        onStopEditing={onStopEditing}
      />
    );
  }
);
DrawingRow.displayName = "DrawingRow";

export { DrawingRow };
