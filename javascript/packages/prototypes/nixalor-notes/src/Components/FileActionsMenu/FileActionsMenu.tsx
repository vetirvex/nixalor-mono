import { memo } from "react";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useImportFile } from "../../Shared/Hooks/useImportFile";
import { useI18n } from "../../Shared/I18n/I18nContext";
import {
  CopyIcon,
  DownloadIcon,
  ImportIcon,
  MoreIcon,
  MoveIcon,
  PencilIcon,
  SmileIcon,
  TrashIcon,
} from "../../Shared/Icons/Icons";
import { getFileKind } from "../../Shared/Storage/StorageTypes";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { toPointAnchor } from "../../Shared/Ui/Menu/anchor";
import { Menu, MenuItem, MenuSeparator } from "../../Shared/Ui/Menu/Menu";
import { useMenu } from "../../Shared/Ui/Menu/useMenu";
import { MOD_KEY } from "../../Shared/Utils/platform";
import { useConfirmDelete } from "../ItemMenu/useConfirmDelete";
import type { FileActionsMenuProps } from "./FileActionsMenuTypes";

/** "⋯" in the top bar of an open board or note: export/import and file actions. */
const FileActionsMenu = memo<FileActionsMenuProps>(
  ({ file, onRename, onExportImage, onExportPdf }) => {
    const { t } = useI18n();
    const { downloadDrawing, duplicateDrawing } = useNotes();
    const { openMove, openIconPicker } = useLayout();
    const importFile = useImportFile();
    const confirmDelete = useConfirmDelete();
    const menu = useMenu();
    const item = { type: "drawing" as const, id: file.id };
    const extension = getFileKind(file) === "note" ? ".md" : ".excalidraw";

    return (
      <>
        <IconButton
          label={t("common.moreActions")}
          variant="outlined"
          active={menu.isOpen}
          onClick={menu.toggleFromEvent}
        >
          <MoreIcon size={18} />
        </IconButton>
        {menu.anchor && (
          <Menu anchor={menu.anchor} onClose={menu.close} align="end" minWidth={230}>
            {onExportImage && (
              <MenuItem
                icon={<DownloadIcon />}
                label={t("board.exportImage")}
                onSelect={onExportImage}
              />
            )}
            {onExportPdf && (
              <MenuItem
                icon={<DownloadIcon />}
                label={t("note.exportPdf")}
                shortcut={`${MOD_KEY}+P`}
                onSelect={onExportPdf}
              />
            )}
            <MenuItem
              icon={<DownloadIcon />}
              label={`${t("common.download")} ${extension}`}
              onSelect={() => void downloadDrawing(file.id)}
            />
            <MenuItem
              icon={<ImportIcon />}
              label={t("board.importFile")}
              onSelect={() => void importFile(file.folderId)}
            />
            <MenuSeparator />
            <MenuItem
              icon={<PencilIcon />}
              label={t("common.rename")}
              onSelect={onRename}
            />
            <MenuItem
              icon={<SmileIcon />}
              label={t("icon.change")}
              onSelect={() => openIconPicker(item, toPointAnchor(menu.anchor!))}
            />
            <MenuItem
              icon={<CopyIcon />}
              label={t("common.duplicate")}
              onSelect={() => void duplicateDrawing(file.id)}
            />
            <MenuItem
              icon={<MoveIcon />}
              label={`${t("common.move")}…`}
              onSelect={() => openMove([item])}
            />
            <MenuSeparator />
            <MenuItem
              icon={<TrashIcon />}
              label={t("common.delete")}
              danger
              onSelect={() => void confirmDelete([item])}
            />
          </Menu>
        )}
      </>
    );
  }
);
FileActionsMenu.displayName = "FileActionsMenu";

export { FileActionsMenu };
