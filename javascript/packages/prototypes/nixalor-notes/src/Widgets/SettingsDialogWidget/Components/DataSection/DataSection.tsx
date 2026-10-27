import { memo, useState } from "react";
import { useConfirm } from "../../../../Providers/ConfirmProvider/ConfirmContext";
import { useNotes } from "../../../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../../../Shared/I18n/I18nContext";
import { getFileKind } from "../../../../Shared/Storage/StorageTypes";
import type { NotesSnapshot } from "../../../../Shared/Storage/StorageTypes";
import { DownloadIcon, ImportIcon } from "../../../../Shared/Icons/Icons";
import { Button } from "../../../../Shared/Ui/Button/Button";
import { InvalidBackupError, readBackup } from "../../../../Shared/Utils/backup";
import { pickFile } from "../../../../Shared/Utils/pickFile";
import classes from "./DataSection.module.css";
import type { BackupStatus } from "./DataSectionTypes";

/** Export of the whole workspace to a .zip and restore from it. */
const DataSection = memo(() => {
  const { t, language } = useI18n();
  const { exportBackup, restoreBackup } = useNotes();
  const confirm = useConfirm();
  const [status, setStatus] = useState<BackupStatus>({ type: "idle" });
  const isWorking = status.type === "working";

  const countItems = (snapshot: NotesSnapshot) => {
    const notes = snapshot.drawings.filter((d) => getFileKind(d) === "note").length;
    return {
      folders: t("count.folders", { count: snapshot.folders.length }),
      boards: t("count.boards", { count: snapshot.drawings.length - notes }),
      notes: t("count.notes", { count: notes }),
    };
  };

  const handleExport = async () => {
    setStatus({ type: "working" });
    try {
      await exportBackup();
      setStatus({ type: "idle" });
    } catch (error) {
      console.error("Failed to export backup", error);
      setStatus({ type: "error", message: t("settings.backupExportFailed") });
    }
  };

  const handleImport = async () => {
    const file = await pickFile();
    if (!file) {
      return;
    }
    setStatus({ type: "working" });
    try {
      const { snapshot, exportedAt } = await readBackup(file);
      const counts = countItems(snapshot);
      const confirmed = await confirm({
        title: t("settings.backupConfirmTitle"),
        message: t("settings.backupConfirmMessage", {
          ...counts,
          date: new Date(exportedAt).toLocaleString(language),
        }),
        confirmLabel: t("settings.backupConfirm"),
      });
      if (!confirmed) {
        setStatus({ type: "idle" });
        return;
      }
      await restoreBackup(snapshot);
      setStatus({ type: "done", message: t("settings.backupDone", counts) });
    } catch (error) {
      console.error("Failed to restore backup", error);
      setStatus({
        type: "error",
        message:
          error instanceof InvalidBackupError
            ? t("settings.backupInvalid", { name: file.name })
            : String(error),
      });
    }
  };

  return (
    <div className={classes.fields}>
      <section className={classes.row}>
        <div className={classes.rowText}>
          <h3 className={classes.label}>{t("settings.backupExport")}</h3>
          <p className={classes.hint}>{t("settings.backupExportHint")}</p>
        </div>
        <Button
          className={classes.action}
          variant="primary"
          icon={<DownloadIcon size={15} />}
          disabled={isWorking}
          onClick={() => void handleExport()}
        >
          {t("settings.backupExportAction")}
        </Button>
      </section>

      <section className={classes.row}>
        <div className={classes.rowText}>
          <h3 className={classes.label}>{t("settings.backupImport")}</h3>
          <p className={classes.hint}>{t("settings.backupImportHint")}</p>
        </div>
        <Button
          className={classes.action}
          icon={<ImportIcon size={15} />}
          disabled={isWorking}
          onClick={() => void handleImport()}
        >
          {t("settings.backupImportAction")}
        </Button>
      </section>

      {status.type !== "idle" ? (
        <p className={classes.status} data-type={status.type} role="status">
          {status.type === "working" ? t("settings.backupWorking") : status.message}
        </p>
      ) : null}
    </div>
  );
});
DataSection.displayName = "DataSection";

export { DataSection };
