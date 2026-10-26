import { memo } from "react";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { CloseIcon } from "../../Shared/Icons/Icons";
import { Button } from "../../Shared/Ui/Button/Button";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import classes from "./BulkBar.module.css";
import type { BulkBarProps } from "./BulkBarTypes";

/** Floating actions for the selected boards, as in the design. */
const BulkBar = memo<BulkBarProps>(
  ({ count, onMove, onDuplicate, onDownload, onDelete, onClear }) => {
    const { t } = useI18n();
    return (
      <div
        className={classes.bulkBar}
        role="toolbar"
        aria-label={t("count.selected", { count })}
      >
        <span className={classes.count}>{t("count.selected", { count })}</span>
        <Button variant="ghost" onClick={onMove}>
          {t("common.move")}
        </Button>
        <Button variant="ghost" onClick={onDuplicate}>
          {t("common.duplicate")}
        </Button>
        <Button variant="ghost" onClick={onDownload}>
          {t("common.download")}
        </Button>
        <Button variant="danger" onClick={onDelete}>
          {t("common.delete")}
        </Button>
        <IconButton label={t("folder.clearSelection")} size="sm" onClick={onClear}>
          <CloseIcon />
        </IconButton>
      </div>
    );
  }
);
BulkBar.displayName = "BulkBar";

export { BulkBar };
