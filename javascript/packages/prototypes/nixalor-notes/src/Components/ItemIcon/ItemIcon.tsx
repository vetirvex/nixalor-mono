import { memo } from "react";
import { parseItemIcon } from "../../Shared/Icons/itemIcons";
import classes from "./ItemIcon.module.css";
import type { ItemIconProps } from "./ItemIconTypes";

/** A board/note/folder icon: custom (icon or emoji) or the default fallback. */
const ItemIcon = memo<ItemIconProps>(({ icon, fallback, size = 16, color }) => {
  const parsed = parseItemIcon(icon);
  if (!parsed) {
    return color ? (
      <span className={classes.itemIcon} style={{ color }}>
        {fallback}
      </span>
    ) : (
      <>{fallback}</>
    );
  }
  return (
    <span
      className={classes.itemIcon}
      style={{ width: size, height: size, color }}
      aria-hidden="true"
    >
      {parsed.type === "icon" ? (
        <parsed.Icon size={size} strokeWidth={2} />
      ) : (
        <span className={classes.emoji} style={{ fontSize: Math.round(size * 0.92) }}>
          {parsed.emoji}
        </span>
      )}
    </span>
  );
});
ItemIcon.displayName = "ItemIcon";

export { ItemIcon };
