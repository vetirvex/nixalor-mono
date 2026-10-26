import { memo } from "react";
import classes from "./Button.module.css";
import type { ButtonProps } from "./ButtonTypes";

const Button = memo<ButtonProps>(
  ({ variant = "secondary", size = "md", icon, className, children, ...rest }) => (
    <button
      type="button"
      className={[classes.button, className].filter(Boolean).join(" ")}
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button };
