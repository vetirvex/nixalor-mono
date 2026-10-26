import { memo } from "react";
import { CheckIcon } from "../../Icons/Icons";
import classes from "./Checkbox.module.css";
import type { CheckboxProps } from "./CheckboxTypes";

const Checkbox = memo<CheckboxProps>(({ label, className, ...rest }) => (
  <span className={[classes.checkbox, className].filter(Boolean).join(" ")}>
    <input type="checkbox" aria-label={label} {...rest} />
    <CheckIcon size={13} strokeWidth={3} className={classes.mark} />
  </span>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
