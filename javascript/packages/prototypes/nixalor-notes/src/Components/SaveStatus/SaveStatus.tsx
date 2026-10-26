import { memo } from "react";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { MOD_KEY } from "../../Shared/Utils/platform";
import classes from "./SaveStatus.module.css";
import type { SaveStatusProps } from "./SaveStatusTypes";

const LABEL_KEYS = {
  saved: "board.saved",
  unsaved: "board.unsaved",
  saving: "board.saving",
  error: "board.saveFailed",
} as const;

const SaveStatus = memo<SaveStatusProps>(({ status, onSave }) => {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={classes.saveStatus}
      data-status={status}
      title={`${t("board.save")} (${MOD_KEY}+S)`}
      onClick={onSave}
    >
      <span className={classes.dot} />
      {t(LABEL_KEYS[status])}
    </button>
  );
});
SaveStatus.displayName = "SaveStatus";

export { SaveStatus };
