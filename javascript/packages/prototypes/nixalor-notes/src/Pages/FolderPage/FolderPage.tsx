import { memo, useMemo, useState } from "react";
import { BoardsSection } from "../../Components/BoardsSection/BoardsSection";
import type { BoardsView } from "../../Components/BoardsSection/BoardsSectionTypes";
import { Breadcrumbs } from "../../Components/Breadcrumbs/Breadcrumbs";
import { ColorMark } from "../../Components/ColorMark/ColorMark";
import { FolderChips } from "../../Components/FolderChips/FolderChips";
import { ItemIconButton } from "../../Components/ItemIconButton/ItemIconButton";
import { ItemMenu } from "../../Components/ItemMenu/ItemMenu";
import { TopBar } from "../../Components/TopBar/TopBar";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import {
  ListIcon,
  MoreIcon,
  PlusIcon,
  StarFilledIcon,
  StarIcon,
  TilesIcon,
} from "../../Shared/Icons/Icons";
import { LocalSettings } from "../../Shared/Storage/LocalSettings";
import type { Drawing } from "../../Shared/Storage/StorageTypes";
import { getFileKind } from "../../Shared/Storage/StorageTypes";
import { Button } from "../../Shared/Ui/Button/Button";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { useMenu } from "../../Shared/Ui/Menu/useMenu";
import { NameInput } from "../../Shared/Ui/NameInput/NameInput";
import { Segmented } from "../../Shared/Ui/Segmented/Segmented";
import { getFolderHex } from "../../Shared/Utils/folderColors";
import { byName, countBoardsInSubtree } from "../../Shared/Utils/folderTree";
import classes from "../Shared/PageLayout.module.css";
import type { FolderPageProps } from "./FolderPageTypes";

type SortKey = "updated" | "created" | "name";

const SORTERS: Record<SortKey, (a: Drawing, b: Drawing) => number> = {
  updated: (a, b) => b.updatedAt - a.updatedAt,
  created: (a, b) => b.createdAt - a.createdAt,
  name: byName,
};

const loadViewPrefs = (): { view: BoardsView; sort: SortKey } => {
  const stored = LocalSettings.getFolderView();
  return {
    view: stored?.view === "tiles" ? "tiles" : "list",
    sort: stored?.sort === "created" || stored?.sort === "name" ? stored.sort : "updated",
  };
};

const FolderPage = memo<FolderPageProps>(({ folderId }) => {
  const { t } = useI18n();
  const { folders, drawings, renameFolder, toggleFavorite } = useNotes();
  const { openCreate } = useLayout();
  const menu = useMenu();
  const [prefs, setPrefs] = useState(loadViewPrefs);
  const [isRenaming, setIsRenaming] = useState(false);

  const folder = folders.find((f) => f.id === folderId);

  const subFolders = useMemo(
    () => folders.filter((f) => f.parentId === folderId).sort(byName),
    [folders, folderId]
  );
  const boardCounts = useMemo(
    () =>
      new Map(
        subFolders.map((f) => [f.id, countBoardsInSubtree(f.id, folders, drawings)])
      ),
    [subFolders, folders, drawings]
  );
  const boards = useMemo(
    () => drawings.filter((d) => d.folderId === folderId).sort(SORTERS[prefs.sort]),
    [drawings, folderId, prefs.sort]
  );

  const updatePrefs = (patch: Partial<typeof prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    LocalSettings.setFolderView(next);
  };

  if (!folder) {
    return null;
  }

  const isFavorite = Boolean(folder.favoritedAt);
  const noteCount = boards.filter((file) => getFileKind(file) === "note").length;
  const boardCount = boards.length - noteCount;
  const meta = [
    ...(boardCount || !noteCount ? [t("count.boards", { count: boardCount })] : []),
    ...(noteCount ? [t("count.notes", { count: noteCount })] : []),
    ...(subFolders.length ? [t("count.folders", { count: subFolders.length })] : []),
  ].join(" · ");

  return (
    <div className={classes.page}>
      <TopBar left={<Breadcrumbs folderId={folder.parentId} current={folder.name} />} />
      <div className={classes.scroll}>
        <div className={classes.content}>
          <header className={classes.header}>
            <div className={classes.heading}>
              <ItemIconButton
                item={{ type: "folder", id: folder.id }}
                icon={folder.icon}
                size={26}
                color={getFolderHex(folder)}
                fallback={<ColorMark color={getFolderHex(folder)} size={14} />}
              />
              <div className={classes.titleRow}>
                {isRenaming ? (
                  <NameInput
                    initialValue={folder.name}
                    onSubmit={(name) => {
                      void renameFolder(folder.id, name);
                      setIsRenaming(false);
                    }}
                    onCancel={() => setIsRenaming(false)}
                  />
                ) : (
                  <h1 className={classes.title} onDoubleClick={() => setIsRenaming(true)}>
                    {folder.name}
                  </h1>
                )}
                <span className={classes.meta}>{meta}</span>
              </div>
              <IconButton
                label={
                  isFavorite
                    ? t("common.removeFromFavorites")
                    : t("common.addToFavorites")
                }
                size="sm"
                active={isFavorite}
                onClick={() => void toggleFavorite({ type: "folder", id: folder.id })}
              >
                {isFavorite ? <StarFilledIcon /> : <StarIcon />}
              </IconButton>
              <IconButton
                label={t("common.moreActions")}
                size="sm"
                onClick={menu.toggleFromEvent}
              >
                <MoreIcon />
              </IconButton>
              {menu.anchor && (
                <ItemMenu
                  item={{ type: "folder", id: folder.id }}
                  anchor={menu.anchor}
                  onClose={menu.close}
                  onRename={() => setIsRenaming(true)}
                />
              )}
            </div>
            <div className={classes.actions}>
              <Segmented<BoardsView>
                label={t("folder.view.list")}
                value={prefs.view}
                onChange={(view) => updatePrefs({ view })}
                options={[
                  {
                    value: "list",
                    label: t("folder.view.list"),
                    icon: <ListIcon size={14} />,
                  },
                  {
                    value: "tiles",
                    label: t("folder.view.tiles"),
                    icon: <TilesIcon size={14} />,
                  },
                ]}
              />
              <select
                className={classes.select}
                aria-label={t("folder.sort.updated")}
                value={prefs.sort}
                onChange={(event) => updatePrefs({ sort: event.target.value as SortKey })}
              >
                <option value="updated">{t("folder.sort.updated")}</option>
                <option value="created">{t("folder.sort.created")}</option>
                <option value="name">{t("folder.sort.name")}</option>
              </select>
              <Button
                icon={<PlusIcon size={15} />}
                onClick={() => openCreate("folder", folderId)}
              >
                {t("folder.addFolder")}
              </Button>
              <Button
                icon={<PlusIcon size={15} />}
                onClick={() => openCreate("note", folderId)}
              >
                {t("folder.addNote")}
              </Button>
              <Button
                variant="primary"
                icon={<PlusIcon size={15} strokeWidth={2.5} />}
                onClick={() => openCreate("board", folderId)}
              >
                {t("folder.addBoard")}
              </Button>
            </div>
          </header>

          <section className={classes.section}>
            <h2 className={classes.sectionTitle}>{t("folder.foldersSection")}</h2>
            <FolderChips
              folders={subFolders}
              boardCounts={boardCounts}
              onCreate={() => openCreate("folder", folderId)}
            />
          </section>

          <section className={classes.section}>
            <h2 className={classes.sectionTitle}>{t("folder.boardsSection")}</h2>
            {boards.length === 0 ? (
              <div className={classes.empty}>
                <span className={classes.emptyTitle}>{t("folder.empty")}</span>
                <span>{t("folder.emptyHint")}</span>
              </div>
            ) : (
              <BoardsSection boards={boards} view={prefs.view} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
});
FolderPage.displayName = "FolderPage";

export { FolderPage };
