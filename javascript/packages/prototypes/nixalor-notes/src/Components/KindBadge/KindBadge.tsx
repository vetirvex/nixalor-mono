import { Brush } from "lucide-react";
import { memo } from "react";
import classes from "./KindBadge.module.css";
import type { KindBadgeProps } from "./KindBadgeTypes";

/** Small always-visible brush marking an Excalidraw drawing in lists. */
const KindBadge = memo<KindBadgeProps>(({ className }) => (
  <span
    className={[classes.kindBadge, className].filter(Boolean).join(" ")}
    title="Excalidraw"
    aria-label="Excalidraw"
  >
    <Brush size={12} strokeWidth={2.2} aria-hidden="true" />
  </span>
));
KindBadge.displayName = "KindBadge";

export { KindBadge };
