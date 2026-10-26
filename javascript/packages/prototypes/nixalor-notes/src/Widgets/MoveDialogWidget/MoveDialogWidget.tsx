import { memo, useId, useMemo, useState } from "react";
import { FolderPicker } from "../../Components/FolderPicker/FolderPicker";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { Button } from "../../Shared/Ui/Button/Button";
import { Dialog, DialogHeader } from "../../Shared/Ui/Dialog/Dialog";
import { getFolderSubtreeIds } from "../../Shared/Utils/folderTree";
import classes from "./MoveDialogWidget.module.css";
import type { MoveDialogWidgetProps } from "./MoveDialogWidgetTypes";

const MoveDialogWidget = memo<MoveDialogWidgetProps>(({ items, onClose }) => {
  const { t } = useI18n();
  const { folders, drawings, moveFolder, moveDrawing } = useNotes();
  const titleId = useId();

  const parentOf = (item: (typeof items)[number]) =>
    item.type === "folder"
      ? (folders.find((f) => f.id === item.id)?.parentId ?? null)
      : (drawings.find((d) => d.id === item.id)?.folderId ?? null);

  // Start from the items' current folder when they all share one.
  const [target, setTarget] = useState<string | null>(() => {
    const parents = new Set(items.map(parentOf));
    return parents.size === 1 ? ([...parents][0] ?? null) : null;
  });

  // A folder can't go into itself or its own subfolders.
  const disabledIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of items) {
      if (item.type === "folder") {
        getFolderSubtreeIds(item.id, folders).forEach((id) => ids.add(id));
      }
    }
    return ids;
  }, [items, folders]);

  const submit = async () => {
    await Promise.all(
      items.map((item) =>
        item.type === "folder"
          ? moveFolder(item.id, target)
          : moveDrawing(item.id, target)
      )
    );
    onClose();
  };

  return (
    <Dialog onClose={onClose} ariaLabelledBy={titleId} width={460} top={110}>
      <DialogHeader title={t("move.title")} titleId={titleId} onClose={onClose} />
      <div className={classes.body}>
        <FolderPicker
          value={target}
          onChange={setTarget}
          label={t("create.where")}
          disabledIds={disabledIds}
        />
      </div>
      <div className={classes.footer}>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="primary" onClick={() => void submit()}>
          {t("move.submit")}
        </Button>
      </div>
    </Dialog>
  );
});
MoveDialogWidget.displayName = "MoveDialogWidget";

export { MoveDialogWidget };
