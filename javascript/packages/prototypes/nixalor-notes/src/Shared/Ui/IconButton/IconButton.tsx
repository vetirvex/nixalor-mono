import { forwardRef, memo } from "react";
import classes from "./IconButton.module.css";
import type { IconButtonProps } from "./IconButtonTypes";

const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(
    (
      { label, size = "md", variant = "plain", active, className, children, ...rest },
      ref
    ) => (
      <button
        ref={ref}
        type="button"
        title={label}
        aria-label={label}
        className={[classes.iconButton, className].filter(Boolean).join(" ")}
        data-size={size}
        data-variant={variant}
        data-active={active}
        {...rest}
      >
        {children}
      </button>
    )
  )
);
IconButton.displayName = "IconButton";

export { IconButton };
