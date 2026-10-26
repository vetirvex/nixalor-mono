import { memo } from "react";
import { ItemIcon } from "../../../../Components/ItemIcon/ItemIcon";
import { KindBadge } from "../../../../Components/KindBadge/KindBadge";
import { useNotes } from "../../../../Providers/NotesProvider/NotesContext";
import { BoardIcon, NoteIcon } from "../../../../Shared/Icons/Icons";
import { getFileKind } from "../../../../Shared/Storage/StorageTypes";
import { getFileIconHex } from "../../../../Shared/Utils/folderColors";
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
          <ItemIcon
            icon={drawing.icon}
            size={15}
            color={getFileIconHex(drawing)}
            fallback={
              getFileKind(drawing) === "note" ? (
                <NoteIcon size={14} />
              ) : (
                <BoardIcon size={14} />
              )
            }
          />
        }
        badge={getFileKind(drawing) === "board" ? <KindBadge /> : undefined}
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
