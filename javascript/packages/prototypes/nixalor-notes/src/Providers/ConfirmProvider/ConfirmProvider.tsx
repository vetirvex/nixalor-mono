import { memo, useCallback, useRef, useState } from "react";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { Button } from "../../Shared/Ui/Button/Button";
import { Dialog } from "../../Shared/Ui/Dialog/Dialog";
import { ConfirmContext } from "./ConfirmContext";
import classes from "./ConfirmProvider.module.css";
import type { ConfirmOptions, ConfirmProviderProps } from "./ConfirmTypes";

const ConfirmProvider = memo<ConfirmProviderProps>(({ children }) => {
  const { t } = useI18n();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolveRef.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const finish = (result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Dialog
          ariaLabelledBy="confirm-title"
          width={440}
          top={160}
          onClose={() => finish(false)}
        >
          <div className={classes.body}>
            <h2 id="confirm-title" className={classes.title}>
              {options.title}
            </h2>
            <p className={classes.message}>{options.message}</p>
          </div>
          <div className={classes.footer}>
            <Button onClick={() => finish(false)}>{t("common.cancel")}</Button>
            <Button
              variant={options.danger ? "danger" : "primary"}
              data-autofocus
              onClick={() => finish(true)}
            >
              {options.confirmLabel}
            </Button>
          </div>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  );
});
ConfirmProvider.displayName = "ConfirmProvider";

export { ConfirmProvider };
