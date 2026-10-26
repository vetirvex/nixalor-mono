import type { ReactNode } from "react";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  /** "tabs" = bold pill tabs (dialogs); "fill" = stretches to the container. */
  variant?: "tabs" | "fill" | "compact";
  /** Hide labels visually and show icons only (labels stay as tooltips). */
  iconOnly?: boolean;
  renderLabel?: (option: SegmentedOption<T>) => ReactNode;
}

export type { SegmentedOption, SegmentedProps };
