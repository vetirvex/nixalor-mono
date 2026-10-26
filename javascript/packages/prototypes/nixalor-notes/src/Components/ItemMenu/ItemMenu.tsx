import { memo } from "react";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import {
  BoardIcon,
  CopyIcon,
  DownloadIcon,
  FolderIcon,
  NoteIcon,
  MoveIcon,
  PencilIcon,
  PlusIcon,
  SmileIcon,
  StarFilledIcon,
  StarIcon,
  TrashIcon,
} from "../../Shared/Icons/Icons";
import { getFileKind } from "../../Shared/Storage/StorageTypes";
import { toPointAnchor } from "../../Shared/Ui/Menu/anchor";
import { Menu, MenuItem, MenuSeparator } from "../../Shared/Ui/Menu/Menu";
import type { ItemMenuProps } from "./ItemMenuTypes";
import { useConfirmDelete } from "./useConfirmDelete";

/** The shared "⋯" / right-click menu for a board, a note or a folder. */
const ItemMenu = memo<ItemMenuProps>(({ item, anchor, onClose, onRename, align }) => {
  const { t } = useI18n();
  const {
    folders,
    drawings,
    navigate,
    toggleFavorite,
    duplicateDrawing,
    downloadDrawing,
  } = useNotes();
  const { openCreate, openMove, openIconPicker } = useLayout();
  const confirmDelete = useConfirmDelete();

  const entity =
    item.type === "folder"
      ? folders.find((f) => f.id === item.id)
      : drawings.find((d) => d.id === item.id);
  if (!entity) {
    return null;
  }
  const isFavorite = Boolean(entity.favoritedAt);
  // Captured now: the trigger may be hidden once the menu closes.
  const pickerAnchor = toPointAnchor(anchor);
  const folder =
    item.type === "folder" ? folders.find((f) => f.id === item.id) : undefined;
  const file =
    item.type === "drawing" ? drawings.find((d) => d.id === item.id) : undefined;
  const isNote = file ? getFileKind(file) === "note" : false;

  return (
    <Menu anchor={anchor} onClose={onClose} align={align} label={entity.name}>
      <MenuItem
        icon={folder ? <FolderIcon /> : isNote ? <NoteIcon /> : <BoardIcon />}
        label={t("common.open")}
        onSelect={() => navigate({ type: item.type, id: item.id })}
      />
      {folder && (
        <>
          <MenuItem
            icon={<PlusIcon />}
            label={t("tree.newBoardInside")}
            onSelect={() => openCreate("board", folder.id)}
          />
          <MenuItem
            icon={<PlusIcon />}
            label={t("tree.newNoteInside")}
            onSelect={() => openCreate("note", folder.id)}
          />
          <MenuItem
            icon={<PlusIcon />}
            label={t("tree.newSubfolder")}
            onSelect={() => openCreate("folder", folder.id)}
          />
        </>
      )}
      <MenuSeparator />
      {onRename && (
        <MenuItem icon={<PencilIcon />} label={t("common.rename")} onSelect={onRename} />
      )}
      <MenuItem
        icon={<SmileIcon />}
        label={t("icon.change")}
        onSelect={() => openIconPicker(item, pickerAnchor)}
      />
      <MenuItem
        icon={isFavorite ? <StarFilledIcon /> : <StarIcon />}
        label={isFavorite ? t("common.removeFromFavorites") : t("common.addToFavorites")}
        onSelect={() => void toggleFavorite(item)}
      />
      <MenuItem
        icon={<MoveIcon />}
        label={`${t("common.move")}…`}
        onSelect={() => openMove([item])}
      />
      {item.type === "drawing" && (
        <>
          <MenuItem
            icon={<CopyIcon />}
            label={t("common.duplicate")}
            onSelect={() => void duplicateDrawing(item.id)}
          />
          <MenuItem
            icon={<DownloadIcon />}
            label={`${t("common.download")} ${isNote ? ".md" : ".excalidraw"}`}
            onSelect={() => void downloadDrawing(item.id)}
          />
        </>
      )}
      <MenuSeparator />
      <MenuItem
        icon={<TrashIcon />}
        label={t("common.delete")}
        danger
        onSelect={() => void confirmDelete([item])}
      />
    </Menu>
  );
});
ItemMenu.displayName = "ItemMenu";

export { ItemMenu };
