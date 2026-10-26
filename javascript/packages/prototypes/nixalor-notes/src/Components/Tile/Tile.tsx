import { memo } from "react";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { MoreIcon, StarFilledIcon, StarIcon } from "../../Shared/Icons/Icons";
import { Checkbox } from "../../Shared/Ui/Checkbox/Checkbox";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { useMenu } from "../../Shared/Ui/Menu/useMenu";
import { ItemIcon } from "../ItemIcon/ItemIcon";
import { ItemMenu } from "../ItemMenu/ItemMenu";
import classes from "./Tile.module.css";
import type { TileProps } from "./TileTypes";

const Tile = memo<TileProps>(
  ({
    item,
    color,
    preview,
    title,
    icon,
    iconColor,
    meta,
    isFavorite,
    isSelected = false,
    onToggleSelect,
    onOpen,
  }) => {
    const { t } = useI18n();
    const { toggleFavorite } = useNotes();
    const menu = useMenu();

    return (
      <article
        className={classes.tile}
        data-selected={isSelected}
        onContextMenu={menu.openAtPointer}
      >
        <button
          type="button"
          className={classes.preview}
          style={{ background: `color-mix(in srgb, ${color} 14%, var(--surface-1))` }}
          onClick={onOpen}
          aria-label={title}
        >
          {preview}
        </button>
        {onToggleSelect && (
          <span className={classes.check}>
            <Checkbox label={title} checked={isSelected} onChange={onToggleSelect} />
          </span>
        )}
        <div className={classes.footer}>
          <button type="button" className={classes.text} onClick={onOpen}>
            <span className={classes.title}>
              <ItemIcon icon={icon} size={14} color={iconColor} fallback={null} />
              {title}
            </span>
            <span className={classes.meta}>{meta}</span>
          </button>
          <IconButton
            label={
              isFavorite ? t("common.removeFromFavorites") : t("common.addToFavorites")
            }
            size="sm"
            active={isFavorite}
            aria-pressed={isFavorite}
            onClick={() => void toggleFavorite(item)}
          >
            {isFavorite ? <StarFilledIcon size={18} /> : <StarIcon size={18} />}
          </IconButton>
          <IconButton
            label={t("common.moreActions")}
            size="sm"
            onClick={menu.toggleFromEvent}
          >
            <MoreIcon />
          </IconButton>
        </div>
        {menu.anchor && (
          <ItemMenu item={item} anchor={menu.anchor} align="end" onClose={menu.close} />
        )}
      </article>
    );
  }
);
Tile.displayName = "Tile";

export { Tile };
