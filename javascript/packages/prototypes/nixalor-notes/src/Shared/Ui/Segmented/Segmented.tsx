import { memo } from "react";
import classes from "./Segmented.module.css";
import type { SegmentedProps } from "./SegmentedTypes";

const SegmentedImpl = <T extends string>({
  value,
  options,
  onChange,
  label,
  variant = "compact",
  iconOnly = false,
  renderLabel,
}: SegmentedProps<T>) => (
  <div
    className={classes.segmented}
    data-variant={variant}
    role="radiogroup"
    aria-label={label}
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        title={iconOnly ? option.label : undefined}
        aria-label={iconOnly ? option.label : undefined}
        className={classes.option}
        onClick={() => onChange(option.value)}
      >
        {option.icon}
        {!iconOnly && (renderLabel ? renderLabel(option) : option.label)}
      </button>
    ))}
  </div>
);
SegmentedImpl.displayName = "SegmentedImpl";

const Segmented = memo(SegmentedImpl) as typeof SegmentedImpl & { displayName?: string };
Segmented.displayName = "Segmented";

export { Segmented };
