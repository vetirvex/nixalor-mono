import { memo, useCallback, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { AppLogo } from "../../Components/AppLogo/AppLogo";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { PlusIcon, SearchIcon, SettingsIcon } from "../../Shared/Icons/Icons";
import type { Drawing, Folder } from "../../Shared/Storage/StorageTypes";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { Kbd } from "../../Shared/Ui/Kbd/Kbd";
import { ResizeHandle } from "../../Shared/Ui/ResizeHandle/ResizeHandle";
import { byName, countBoardsInSubtree } from "../../Shared/Utils/folderTree";
import { MOD_KEY } from "../../Shared/Utils/platform";
import { DrawingRow } from "./Components/DrawingRow/DrawingRow";
import { FavoritesSection } from "./Components/FavoritesSection/FavoritesSection";
import { FolderRow } from "./Components/FolderRow/FolderRow";
import { NavItem } from "./Components/NavItem/NavItem";
import classes from "./LeftMenuWidget.module.css";
import type { LeftMenuWidgetProps, NotesTree } from "./LeftMenuWidgetTypes";
import { TreeDndContext } from "./TreeDnd/TreeDndContext";
import { useTreeDndState } from "./TreeDnd/useTreeDndState";

const groupBy = <T extends { name: string }>(
  items: T[],
  getKey: (item: T) => string | null
) => {
  const map = new Map<string | null, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  map.forEach((group) => group.sort(byName));
  return map;
};

const LeftMenuWidget = memo<LeftMenuWidgetProps>(() => {
  const { t } = useI18n();
  const { isLoaded, folders, drawings } = useNotes();
  const { isSidebarOpen, openPalette, openCreate, openSettings } = useLayout();
  const [editingId, setEditingId] = useState<string | null>(null);
  const dnd = useTreeDndState();

  const tree = useMemo<NotesTree>(
    () => ({
      foldersByParent: groupBy<Folder>(folders, (f) => f.parentId),
      drawingsByFolder: groupBy<Drawing>(drawings, (d) => d.folderId),
      boardCounts: new Map(
        folders.map((folder) => [
          folder.id,
          countBoardsInSubtree(folder.id, folders, drawings),
        ])
      ),
    }),
    [folders, drawings]
  );

  const stopEditing = useCallback(() => setEditingId(null), []);

  // Dropping on empty space in the tree moves the item to the root.
  const handleTreeDragOver = (event: DragEvent<HTMLElement>) => {
    if (dnd.dragItem && dnd.hover(null)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  };

  const handleTreeDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      dnd.leave();
    }
  };

  const handleTreeDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dnd.drop(null);
  };

  const rootFolders = tree.foldersByParent.get(null) ?? [];
  const rootDrawings = tree.drawingsByFolder.get(null) ?? [];
  const isEmpty = rootFolders.length === 0 && rootDrawings.length === 0;

  return (
    <aside
      className={classes.leftMenuContainer}
      data-open={isSidebarOpen}
      aria-hidden={!isSidebarOpen}
      inert={!isSidebarOpen}
    >
      <ResizeHandle panel="sidebar" edge="right" label={t("panel.resize")} />
      <TreeDndContext.Provider value={dnd}>
        <nav className={classes.panel} aria-label={t("nav.workspace")}>
          <div className={classes.workspace}>
            <AppLogo size={30} className={classes.logo} />
            <span className={classes.workspaceText}>
              <span className={classes.workspaceName}>{t("app.name")}</span>
              <span className={classes.workspaceMeta}>
                {t("count.files", { count: drawings.length })}
              </span>
            </span>
          </div>

          <button type="button" className={classes.search} onClick={openPalette}>
            <SearchIcon size={15} />
            <span className={classes.searchLabel}>{t("nav.search")}</span>
            <Kbd>{MOD_KEY}K</Kbd>
          </button>

          <FavoritesSection />

          <section
            className={classes.folders}
            aria-label={t("nav.folders")}
            data-drop-target={dnd.dropTarget?.folderId === null}
            onDragOver={handleTreeDragOver}
            onDragLeave={handleTreeDragLeave}
            onDrop={handleTreeDrop}
          >
            <div className={classes.sectionHeader}>
              <span className={classes.sectionTitle}>{t("nav.folders")}</span>
              <IconButton
                label={t("nav.newFolder")}
                size="sm"
                onClick={() => openCreate("folder", null)}
              >
                <PlusIcon size={16} />
              </IconButton>
            </div>
            {isLoaded && isEmpty && <p className={classes.empty}>{t("nav.emptyTree")}</p>}
            <ul role="tree" className={classes.treeList}>
              {rootFolders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  depth={0}
                  tree={tree}
                  editingId={editingId}
                  onStartEditing={setEditingId}
                  onStopEditing={stopEditing}
                />
              ))}
              {rootDrawings.map((drawing) => (
                <DrawingRow
                  key={drawing.id}
                  drawing={drawing}
                  depth={0}
                  editingId={editingId}
                  onStartEditing={setEditingId}
                  onStopEditing={stopEditing}
                />
              ))}
            </ul>
          </section>

          <div className={classes.footer}>
            <NavItem
              icon={<SettingsIcon />}
              label={t("nav.settings")}
              onClick={openSettings}
            />
            <p className={classes.storage}>{t("app.storage")}</p>
          </div>
        </nav>
      </TreeDndContext.Provider>
    </aside>
  );
});
LeftMenuWidget.displayName = "LeftMenuWidget";

export { LeftMenuWidget };
