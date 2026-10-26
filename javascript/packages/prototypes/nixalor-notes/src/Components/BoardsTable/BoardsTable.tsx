import { memo } from "react";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { MoreIcon, StarFilledIcon } from "../../Shared/Icons/Icons";
import { Checkbox } from "../../Shared/Ui/Checkbox/Checkbox";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { useMenu } from "../../Shared/Ui/Menu/useMenu";
import { NameInput } from "../../Shared/Ui/NameInput/NameInput";
import { FileThumbnail } from "../FileThumbnail/FileThumbnail";
import { ItemMenu } from "../ItemMenu/ItemMenu";
import classes from "./BoardsTable.module.css";
import type { BoardsTableProps, BoardsTableRowProps } from "./BoardsTableTypes";

const BoardsTableRow = memo<BoardsTableRowProps>(
  ({ board, isSelected, onToggle, isEditing, onEditingChange }) => {
    const { t, formatRelativeTime } = useI18n();
    const { navigate, renameDrawing } = useNotes();
    const menu = useMenu();

    return (
      <tr
        className={classes.row}
        data-selected={isSelected}
        onContextMenu={menu.openAtPointer}
        onClick={() => !isEditing && navigate({ type: "drawing", id: board.id })}
      >
        <td className={classes.checkCell} onClick={(event) => event.stopPropagation()}>
          <Checkbox label={board.name} checked={isSelected} onChange={onToggle} />
        </td>
        <td>
          <div className={classes.nameCell}>
            <FileThumbnail file={board} className={classes.thumb} />
            {isEditing ? (
              <NameInput
                initialValue={board.name}
                onSubmit={(name) => {
                  void renameDrawing(board.id, name);
                  onEditingChange(null);
                }}
                onCancel={() => onEditingChange(null)}
              />
            ) : (
              <button type="button" className={classes.name}>
                {board.name}
              </button>
            )}
            {board.favoritedAt && <StarFilledIcon size={13} className={classes.star} />}
          </div>
        </td>
        <td className={classes.muted}>{formatRelativeTime(board.updatedAt)}</td>
        <td className={classes.muted}>{formatRelativeTime(board.createdAt)}</td>
        <td className={classes.menuCell} onClick={(event) => event.stopPropagation()}>
          <IconButton
            label={t("common.moreActions")}
            size="sm"
            onClick={menu.toggleFromEvent}
          >
            <MoreIcon />
          </IconButton>
          {menu.anchor && (
            <ItemMenu
              item={{ type: "drawing", id: board.id }}
              anchor={menu.anchor}
              align="end"
              onClose={menu.close}
              onRename={() => onEditingChange(board.id)}
            />
          )}
        </td>
      </tr>
    );
  }
);
BoardsTableRow.displayName = "BoardsTableRow";

const BoardsTable = memo<BoardsTableProps>(
  ({ boards, selectedIds, onSelectionChange, editingId, onEditingChange }) => {
    const { t } = useI18n();
    const allSelected = boards.length > 0 && boards.every((b) => selectedIds.has(b.id));

    const toggle = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange(next);
    };

    return (
      <div className={classes.boardsTable}>
        <table>
          <thead>
            <tr>
              <th className={classes.checkCell}>
                <Checkbox
                  label={t("folder.selectAll")}
                  checked={allSelected}
                  onChange={() =>
                    onSelectionChange(
                      allSelected ? new Set() : new Set(boards.map((b) => b.id))
                    )
                  }
                />
              </th>
              <th>{t("folder.column.name")}</th>
              <th>{t("folder.column.updated")}</th>
              <th>{t("folder.column.created")}</th>
              <th className={classes.menuCell} />
            </tr>
          </thead>
          <tbody>
            {boards.map((board) => (
              <BoardsTableRow
                key={board.id}
                board={board}
                isSelected={selectedIds.has(board.id)}
                onToggle={() => toggle(board.id)}
                isEditing={editingId === board.id}
                onEditingChange={onEditingChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);
BoardsTable.displayName = "BoardsTable";

export { BoardsTable };
