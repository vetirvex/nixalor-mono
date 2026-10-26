import { memo } from "react";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { ItemIcon } from "../ItemIcon/ItemIcon";
import classes from "./ItemIconButton.module.css";
import type { ItemIconButtonProps } from "./ItemIconButtonTypes";

/** The icon in a page header — click to change it, like in Notion/Obsidian. */
const ItemIconButton = memo<ItemIconButtonProps>(
  ({ item, icon, fallback, size, color }) => {
    const { t } = useI18n();
    const { openIconPicker } = useLayout();
    return (
      <button
        type="button"
        className={classes.itemIconButton}
        title={t("icon.change")}
        aria-label={t("icon.change")}
        onClick={(event) => openIconPicker(item, { element: event.currentTarget })}
      >
        <ItemIcon icon={icon} size={size} color={color} fallback={fallback} />
      </button>
    );
  }
);
ItemIconButton.displayName = "ItemIconButton";

export { ItemIconButton };
