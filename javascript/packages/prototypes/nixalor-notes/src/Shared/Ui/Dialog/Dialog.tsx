import { memo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../I18n/I18nContext";
import { CloseIcon } from "../../Icons/Icons";
import { IconButton } from "../IconButton/IconButton";
import classes from "./Dialog.module.css";
import type { DialogHeaderProps, DialogProps } from "./DialogTypes";

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])';

const Dialog = memo<DialogProps>(
  ({
    onClose,
    ariaLabel,
    ariaLabelledBy,
    width = 620,
    top = 96,
    className,
    children,
  }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const panel = panelRef.current;
      // Prefer an explicit [data-autofocus] field, then the first focusable element.
      const target =
        panel?.querySelector<HTMLElement>("[data-autofocus]") ??
        panel?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panel)?.focus();

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCloseRef.current();
        } else if (event.key === "Tab" && panel) {
          // Keep focus inside the dialog.
          const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
          const first = items[0];
          const last = items[items.length - 1];
          if (!first || !last) {
            return;
          }
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", onKeyDown, { capture: true });
      return () => {
        window.removeEventListener("keydown", onKeyDown, { capture: true });
        previouslyFocused?.focus?.();
      };
    }, []);

    return createPortal(
      <div className={classes.layer}>
        <div className={classes.overlay} onMouseDown={() => onCloseRef.current()} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          tabIndex={-1}
          className={[classes.panel, className].filter(Boolean).join(" ")}
          style={{ width, top }}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
Dialog.displayName = "Dialog";

const DialogHeader = memo<DialogHeaderProps>(({ title, titleId, onClose }) => {
  const { t } = useI18n();
  return (
    <div className={classes.header}>
      <h1 id={titleId} className={classes.title}>
        {title}
      </h1>
      <IconButton label={t("common.close")} variant="filled" onClick={onClose}>
        <CloseIcon size={18} />
      </IconButton>
    </div>
  );
});
DialogHeader.displayName = "DialogHeader";

export { Dialog, DialogHeader };
