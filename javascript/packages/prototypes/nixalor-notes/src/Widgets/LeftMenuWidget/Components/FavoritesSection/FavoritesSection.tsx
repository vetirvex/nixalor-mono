import { memo, useMemo } from "react";
import { ColorMark } from "../../../../Components/ColorMark/ColorMark";
import { useNotes } from "../../../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../../../Shared/I18n/I18nContext";
import { StarFilledIcon } from "../../../../Shared/Icons/Icons";
import { getFolderHex } from "../../../../Shared/Utils/folderColors";
import classes from "./FavoritesSection.module.css";
import type { FavoritesSectionProps } from "./FavoritesSectionTypes";

const FavoritesSection = memo<FavoritesSectionProps>(() => {
  const { folders, drawings, route, navigate } = useNotes();
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
          favoritedAt: folder.favoritedAt ?? 0,
        })),
      ...drawings
        .filter((drawing) => drawing.favoritedAt)
        .map((drawing) => ({
          type: "drawing" as const,
          id: drawing.id,
          name: drawing.name,
          color: getFolderHex(drawing.folderId ? folderById.get(drawing.folderId) : null),
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
        <StarFilledIcon size={13} className={classes.star} />
      </button>
      {items.length === 0 ? (
        <p className={classes.empty}>{t("nav.emptyFavorites")}</p>
      ) : (
        items.map((item) => (
          <button
            key={`${item.type}:${item.id}`}
            type="button"
            className={classes.item}
            aria-current={
              route.type === item.type && "id" in route && route.id === item.id
                ? "page"
                : undefined
            }
            onClick={() => navigate({ type: item.type, id: item.id })}
          >
            <ColorMark
              color={item.color}
              shape={item.type === "drawing" ? "dot" : "square"}
            />
            <span className={classes.name}>{item.name}</span>
          </button>
        ))
      )}
    </section>
  );
});
FavoritesSection.displayName = "FavoritesSection";

export { FavoritesSection };
