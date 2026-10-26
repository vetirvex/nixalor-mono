import { memo } from "react";
import classes from "./ColorSwatches.module.css";
import type { ColorSwatchesProps } from "./ColorSwatchesTypes";

const ColorSwatchesImpl = <T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: ColorSwatchesProps<T>) => (
  <div
    className={classes.colorSwatches}
    data-size={size}
    role="radiogroup"
    aria-label={label}
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        aria-label={option.label}
        title={option.label}
        className={classes.swatch}
        style={{ background: option.hex }}
        onClick={() => onChange(option.value)}
      />
    ))}
  </div>
);
ColorSwatchesImpl.displayName = "ColorSwatchesImpl";

const ColorSwatches = memo(ColorSwatchesImpl) as typeof ColorSwatchesImpl & {
  displayName?: string;
};
ColorSwatches.displayName = "ColorSwatches";

export { ColorSwatches };
