import { memo, useMemo, useState } from "react";
import { FileThumbnail } from "../../Components/FileThumbnail/FileThumbnail";
import { ItemIcon } from "../../Components/ItemIcon/ItemIcon";
import { Tile } from "../../Components/Tile/Tile";
import { TopBar } from "../../Components/TopBar/TopBar";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { FolderFilledIcon } from "../../Shared/Icons/Icons";
import { Segmented } from "../../Shared/Ui/Segmented/Segmented";
import { getFileIconHex, getFolderHex } from "../../Shared/Utils/folderColors";
import { countBoardsInSubtree, getFolderPath } from "../../Shared/Utils/folderTree";
import classes from "../Shared/PageLayout.module.css";
import type { FavoritesPageProps } from "./FavoritesPageTypes";

type Filter = "all" | "boards" | "folders";

const FavoritesPage = memo<FavoritesPageProps>(() => {
  const { t, formatRelativeTime } = useI18n();
  const { folders, drawings, navigate } = useNotes();
  const [filter, setFilter] = useState<Filter>("all");

  const tiles = useMemo(() => {
    const folderTiles =
      filter === "boards"
        ? []
        : folders
            .filter((f) => f.favoritedAt)
            .map((folder) => {
              const color = getFolderHex(folder);
              return {
                key: `folder:${folder.id}`,
                order: folder.favoritedAt ?? 0,
                node: (
                  <Tile
                    key={`folder:${folder.id}`}
                    item={{ type: "folder", id: folder.id }}
                    color={color}
                    icon={folder.icon}
                    iconColor={color}
                    preview={
                      <ItemIcon
                        icon={folder.icon}
                        size={48}
                        color={color}
                        fallback={
                          <FolderFilledIcon size={56} strokeWidth={0} style={{ color }} />
                        }
                      />
                    }
                    title={folder.name}
                    meta={t("favorites.folderMeta", {
                      files: t("count.files", {
                        count: countBoardsInSubtree(folder.id, folders, drawings),
                      }),
                    })}
                    isFavorite
                    onOpen={() => navigate({ type: "folder", id: folder.id })}
                  />
                ),
              };
            });
    const boardTiles =
      filter === "folders"
        ? []
        : drawings
            .filter((d) => d.favoritedAt)
            .map((board) => {
              const path = getFolderPath(board.folderId, folders);
              const location = path.map((f) => f.name).join(" / ") || t("app.name");
              return {
                key: `drawing:${board.id}`,
                order: board.favoritedAt ?? 0,
                node: (
                  <Tile
                    key={`drawing:${board.id}`}
                    item={{ type: "drawing", id: board.id }}
                    icon={board.icon}
                    iconColor={getFileIconHex(board)}
                    color={getFolderHex(path[path.length - 1])}
                    preview={<FileThumbnail file={board} />}
                    title={board.name}
                    meta={`${location} · ${formatRelativeTime(board.updatedAt)}`}
                    isFavorite
                    onOpen={() => navigate({ type: "drawing", id: board.id })}
                  />
                ),
              };
            });
    return [...boardTiles, ...folderTiles].sort((a, b) => a.order - b.order);
  }, [filter, folders, drawings, navigate, t, formatRelativeTime]);

  return (
    <div className={classes.page}>
      <TopBar left={<strong>{t("favorites.title")}</strong>} />
      <div className={classes.scroll}>
        <div className={classes.content}>
          <header className={classes.header}>
            <div className={classes.headingText}>
              <h1 className={classes.title}>{t("favorites.title")}</h1>
              <p className={classes.subtitle}>{t("favorites.subtitle")}</p>
            </div>
            <Segmented<Filter>
              label={t("favorites.title")}
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: t("favorites.filter.all") },
                { value: "boards", label: t("favorites.filter.boards") },
                { value: "folders", label: t("favorites.filter.folders") },
              ]}
            />
          </header>
          {tiles.length === 0 ? (
            <div className={classes.empty}>{t("favorites.empty")}</div>
          ) : (
            <div className={classes.tiles}>{tiles.map((tile) => tile.node)}</div>
          )}
        </div>
      </div>
    </div>
  );
});
FavoritesPage.displayName = "FavoritesPage";

export { FavoritesPage };
