import { useCallback } from "react";
import { useConfirm } from "../../Providers/ConfirmProvider/ConfirmContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import type { ItemRef } from "../../Providers/NotesProvider/NotesTypes";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { getFileKind } from "../../Shared/Storage/StorageTypes";
import { getFolderSubtreeIds } from "../../Shared/Utils/folderTree";

/** Asks for confirmation with a message that says what exactly will be lost. */
const useConfirmDelete = () => {
  const { folders, drawings, deleteItems } = useNotes();
  const { t } = useI18n();
  const confirm = useConfirm();

  return useCallback(
    async (items: ItemRef[]) => {
      if (items.length === 0) {
        return false;
      }
      let title: string;
      let message: string;
      const [single] = items;
      if (items.length > 1 || !single) {
        title = t("confirm.deleteMany.title");
        message = t("confirm.deleteMany.message", { count: items.length });
      } else if (single.type === "drawing") {
        const file = drawings.find((d) => d.id === single.id);
        const name = file?.name ?? "";
        title =
          file && getFileKind(file) === "note"
            ? t("confirm.deleteNote.title")
            : t("confirm.deleteBoard.title");
        message = t("confirm.deleteBoard.message", { name });
      } else {
        const name = folders.find((f) => f.id === single.id)?.name ?? "";
        const subtree = getFolderSubtreeIds(single.id, folders);
        const boardCount = drawings.filter(
          (d) => d.folderId && subtree.has(d.folderId)
        ).length;
        const folderCount = subtree.size - 1;
        title = t("confirm.deleteFolder.title");
        message =
          boardCount + folderCount === 0
            ? t("confirm.deleteFolderEmpty.message", { name })
            : t("confirm.deleteFolder.message", {
                name,
                boards: t("count.files", { count: boardCount }),
                folders: t("count.folders", { count: folderCount }),
              });
      }
      const ok = await confirm({
        title,
        message,
        confirmLabel: t("common.delete"),
        danger: true,
      });
      if (ok) {
        await deleteItems(items);
      }
      return ok;
    },
    [confirm, deleteItems, drawings, folders, t]
  );
};

export { useConfirmDelete };
