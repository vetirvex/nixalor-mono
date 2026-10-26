import { memo } from "react";
import classes from "./ColorMark.module.css";
import type { ColorMarkProps } from "./ColorMarkTypes";

const ColorMark = memo<ColorMarkProps>(({ color, shape = "square", size }) => (
  <span
    aria-hidden="true"
    className={classes.colorMark}
    data-shape={shape}
    style={{ background: color, width: size, height: size }}
  />
));
ColorMark.displayName = "ColorMark";

export { ColorMark };
