import { memo } from "react";
import classes from "./Kbd.module.css";
import type { KbdProps } from "./KbdTypes";

const Kbd = memo<KbdProps>(({ children }) => (
  <kbd className={classes.kbd}>{children}</kbd>
));
Kbd.displayName = "Kbd";

export { Kbd };
