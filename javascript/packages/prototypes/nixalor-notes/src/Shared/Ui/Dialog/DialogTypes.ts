import type { ReactNode } from "react";

interface DialogProps {
  onClose: () => void;
  /** Accessible name when there is no visible title element. */
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Panel width in px (capped by the viewport). */
  width?: number;
  /** Distance from the top of the viewport in px. */
  top?: number;
  className?: string;
  children: ReactNode;
}

interface DialogHeaderProps {
  title: string;
  titleId: string;
  onClose: () => void;
}

export type { DialogHeaderProps, DialogProps };
