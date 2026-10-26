import { memo, useMemo } from "react";
import { ColorMark } from "../../../../Components/ColorMark/ColorMark";
import { ItemIcon } from "../../../../Components/ItemIcon/ItemIcon";
import { KindBadge } from "../../../../Components/KindBadge/KindBadge";
import { useNotes } from "../../../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../../../Shared/I18n/I18nContext";
import { ChevronRightIcon, CloseIcon } from "../../../../Shared/Icons/Icons";
import { getFileKind } from "../../../../Shared/Storage/StorageTypes";
import { IconButton } from "../../../../Shared/Ui/IconButton/IconButton";
import { getFileIconHex, getFolderHex } from "../../../../Shared/Utils/folderColors";
import classes from "./FavoritesSection.module.css";
import type { FavoritesSectionProps } from "./FavoritesSectionTypes";

const FavoritesSection = memo<FavoritesSectionProps>(() => {
  const { folders, drawings, route, navigate, toggleFavorite } = useNotes();
  const { t } = useI18n();

  const items = useMemo(() => {
    const folderById = new Map(folders.map((folder) => [folder.id, folder]));
    return [
      ...folders
        .filter((folder) => folder.favoritedAt)
        .map((folder) => ({
          type: "folder" as const,
          id: folder.id,
          name: folder.name,
          color: getFolderHex(folder),
          icon: folder.icon,
          iconColor: getFolderHex(folder),
          isBoard: false,
          favoritedAt: folder.favoritedAt ?? 0,
        })),
      ...drawings
        .filter((drawing) => drawing.favoritedAt)
        .map((drawing) => ({
          type: "drawing" as const,
          id: drawing.id,
          name: drawing.name,
          color: getFolderHex(drawing.folderId ? folderById.get(drawing.folderId) : null),
          icon: drawing.icon,
          iconColor: getFileIconHex(drawing),
          isBoard: getFileKind(drawing) === "board",
          favoritedAt: drawing.favoritedAt ?? 0,
        })),
    ].sort((a, b) => a.favoritedAt - b.favoritedAt);
  }, [folders, drawings]);

  const isFavoritesPage = route.type === "favorites";

  return (
    <section className={classes.favoritesSection} aria-label={t("nav.favorites")}>
      <button
        type="button"
        className={classes.header}
        aria-current={isFavoritesPage ? "page" : undefined}
        onClick={() => navigate({ type: "favorites" })}
      >
        <span className={classes.title}>{t("nav.favorites")}</span>
        <ChevronRightIcon size={14} strokeWidth={2.5} className={classes.arrow} />
      </button>
      {items.length === 0 ? (
        <p className={classes.empty}>{t("nav.emptyFavorites")}</p>
      ) : (
        items.map((item) => (
          <div
            key={`${item.type}:${item.id}`}
            className={classes.item}
            data-current={
              route.type === item.type && "id" in route && route.id === item.id
            }
          >
            <button
              type="button"
              className={classes.open}
              onClick={() => navigate({ type: item.type, id: item.id })}
            >
              <ItemIcon
                icon={item.icon}
                size={14}
                color={item.iconColor}
                fallback={
                  <ColorMark
                    color={item.color}
                    shape={item.type === "drawing" ? "dot" : "square"}
                  />
                }
              />
              <span className={classes.name}>{item.name}</span>
            </button>
            {item.isBoard && <KindBadge className={classes.badge} />}
            <IconButton
              label={t("common.removeFromFavorites")}
              size="xs"
              className={classes.remove}
              onClick={() => void toggleFavorite({ type: item.type, id: item.id })}
            >
              <CloseIcon size={13} />
            </IconButton>
          </div>
        ))
      )}
    </section>
  );
});
FavoritesSection.displayName = "FavoritesSection";

export { FavoritesSection };
