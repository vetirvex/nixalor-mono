import type { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; also shown as the tooltip. */
  label: string;
  size?: "md" | "sm" | "xs";
  variant?: "plain" | "filled" | "outlined";
  active?: boolean;
}

export type { IconButtonProps };
