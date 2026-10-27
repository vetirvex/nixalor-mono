import { serializeAsJSON } from "@excalidraw/excalidraw";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { LocalSettings } from "../../Shared/Storage/LocalSettings";
import { NotesDb } from "../../Shared/Storage/NotesDb";
import type {
  Drawing,
  DrawingScene,
  Folder,
  FolderColor,
  NotesSnapshot,
} from "../../Shared/Storage/StorageTypes";
import { getFileKind } from "../../Shared/Storage/StorageTypes";
import { copyAttachments, inlineAttachments } from "../../Shared/Utils/attachments";
import { createBackup, getBackupFileName } from "../../Shared/Utils/backup";
import { createId } from "../../Shared/Utils/createId";
import { downloadFile } from "../../Shared/Utils/downloadFile";
import { pickNextFolderColor } from "../../Shared/Utils/folderColors";
import { getFolderSubtreeIds } from "../../Shared/Utils/folderTree";
import { NotesContext } from "./NotesContext";
import type {
  CreateDrawingOptions,
  CreateFolderOptions,
  ItemRef,
  NotesContextValue,
  NotesProviderProps,
  Route,
} from "./NotesTypes";

const START: Route = { type: "start" };

const createEmptyScene = (id: string): DrawingScene => ({
  id,
  elements: [],
  appState: {
    viewBackgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 1 as DrawingScene["appState"]["zoom"]["value"] },
    gridModeEnabled: false,
  },
  files: {},
});

/** Expands folder ids to their whole subtrees and collects every board inside. */
const collectItems = (items: ItemRef[], folders: Folder[], drawings: Drawing[]) => {
  const folderIds = new Set<string>();
  for (const item of items) {
    if (item.type === "folder") {
      getFolderSubtreeIds(item.id, folders).forEach((id) => folderIds.add(id));
    }
  }
  const drawingIds = new Set(
    items.filter((item) => item.type === "drawing").map((item) => item.id)
  );
  for (const drawing of drawings) {
    if (drawing.folderId && folderIds.has(drawing.folderId)) {
      drawingIds.add(drawing.id);
    }
  }
  return { folderIds, drawingIds };
};

const NotesProvider = memo<NotesProviderProps>(({ children }) => {
  const { t } = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);
  const [folders, setFoldersState] = useState<Folder[]>([]);
  const [drawings, setDrawingsState] = useState<Drawing[]>([]);
  const [route, setRoute] = useState<Route>(START);
  const [expandedFolderIds, setExpandedFolderIds] = useState<ReadonlySet<string>>(
    () => new Set(LocalSettings.getExpandedFolderIds())
  );

  // Refs mirror state synchronously, so async actions (and the editor's
  // flush-on-unmount) always see the latest tree, e.g. right after a delete.
  const foldersRef = useRef<Folder[]>([]);
  const drawingsRef = useRef<Drawing[]>([]);
  const routeRef = useRef<Route>(START);

  const setFolders = useCallback((next: Folder[]) => {
    foldersRef.current = next;
    setFoldersState(next);
  }, []);

  const setDrawings = useCallback((next: Drawing[]) => {
    drawingsRef.current = next;
    setDrawingsState(next);
  }, []);

  const replaceDrawing = useCallback(
    (updated: Drawing) =>
      setDrawings(drawingsRef.current.map((d) => (d.id === updated.id ? updated : d))),
    [setDrawings]
  );

  const replaceFolder = useCallback(
    (updated: Folder) =>
      setFolders(foldersRef.current.map((f) => (f.id === updated.id ? updated : f))),
    [setFolders]
  );

  const navigate = useCallback(
    (next: Route) => {
      routeRef.current = next;
      setRoute(next);
      LocalSettings.setRoute(next);
      if (next.type === "drawing") {
        const drawing = drawingsRef.current.find((d) => d.id === next.id);
        if (drawing) {
          // openedAt doesn't bump updatedAt: opening a board isn't editing it.
          const opened = { ...drawing, openedAt: Date.now() };
          replaceDrawing(opened);
          void NotesDb.putDrawing(opened);
        }
      }
    },
    [replaceDrawing]
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([NotesDb.getFolders(), NotesDb.getDrawings()])
      .then(([storedFolders, storedDrawings]) => {
        if (cancelled) {
          return;
        }
        setFolders(storedFolders);
        setDrawings(storedDrawings);
        const stored = LocalSettings.getRoute();
        const isValid =
          stored &&
          (stored.type === "drawing"
            ? storedDrawings.some((d) => d.id === stored.id)
            : stored.type === "folder"
              ? storedFolders.some((f) => f.id === stored.id)
              : // Routes from older versions (e.g. "home") are dropped here.
                stored.type === "favorites");
        // Without a valid stored route, reopen the last board the user worked on.
        const lastOpened = [...storedDrawings]
          .filter((d) => d.openedAt)
          .sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0))[0];
        routeRef.current = isValid
          ? stored
          : lastOpened
            ? { type: "drawing", id: lastOpened.id }
            : START;
        setRoute(routeRef.current);
      })
      .catch((error) => console.error("Failed to load notes from IndexedDB", error))
      .finally(() => !cancelled && setIsLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [setFolders, setDrawings]);

  const toggleFolder = useCallback((id: string, expanded?: boolean) => {
    setExpandedFolderIds((prev) => {
      const isExpanded = expanded ?? !prev.has(id);
      if (isExpanded === prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      if (isExpanded) {
        next.add(id);
      } else {
        next.delete(id);
      }
      LocalSettings.setExpandedFolderIds([...next]);
      return next;
    });
  }, []);

  const createFolder = useCallback(
    async (parentId: string | null, options: CreateFolderOptions = {}) => {
      const now = Date.now();
      const folder: Folder = {
        id: createId(),
        name: options.name?.trim() || t("common.untitledFolder"),
        parentId,
        color: options.color ?? pickNextFolderColor(foldersRef.current.length),
        createdAt: now,
        updatedAt: now,
      };
      await NotesDb.putFolder(folder);
      setFolders([...foldersRef.current, folder]);
      if (parentId) {
        toggleFolder(parentId, true);
      }
      return folder;
    },
    [setFolders, t, toggleFolder]
  );

  const updateFolder = useCallback(
    async (id: string, patch: Partial<Folder>) => {
      const folder = foldersRef.current.find((f) => f.id === id);
      if (!folder) {
        return;
      }
      const updated = { ...folder, ...patch, updatedAt: Date.now() };
      replaceFolder(updated);
      await NotesDb.putFolder(updated);
    },
    [replaceFolder]
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      const folder = foldersRef.current.find((f) => f.id === id);
      if (folder && trimmed && trimmed !== folder.name) {
        await updateFolder(id, { name: trimmed });
      }
    },
    [updateFolder]
  );

  const setFolderColor = useCallback(
    (id: string, color: FolderColor) => updateFolder(id, { color }),
    [updateFolder]
  );

  const deleteItems = useCallback(
    async (items: ItemRef[]) => {
      const { folderIds, drawingIds } = collectItems(
        items,
        foldersRef.current,
        drawingsRef.current
      );
      const current = routeRef.current;
      const openParentId =
        current.type === "drawing"
          ? drawingsRef.current.find((d) => d.id === current.id)?.folderId
          : null;

      // Update refs first so a pending autosave of a deleted board is dropped.
      setFolders(foldersRef.current.filter((f) => !folderIds.has(f.id)));
      setDrawings(drawingsRef.current.filter((d) => !drawingIds.has(d.id)));

      if (current.type === "drawing" && drawingIds.has(current.id)) {
        navigate(
          openParentId && !folderIds.has(openParentId)
            ? { type: "folder", id: openParentId }
            : START
        );
      } else if (current.type === "folder" && folderIds.has(current.id)) {
        navigate(START);
      }
      drawingIds.forEach((id) => LocalSettings.setNoteFolds(id, []));
      await NotesDb.deleteItems([...folderIds], [...drawingIds]);
    },
    [navigate, setDrawings, setFolders]
  );

  const deleteFolder = useCallback(
    (id: string) => deleteItems([{ type: "folder", id }]),
    [deleteItems]
  );

  const moveFolder = useCallback(
    async (id: string, parentId: string | null) => {
      const folder = foldersRef.current.find((f) => f.id === id);
      if (!folder || folder.parentId === parentId) {
        return;
      }
      // A folder can't be moved into itself or into one of its own subfolders.
      if (parentId && getFolderSubtreeIds(id, foldersRef.current).has(parentId)) {
        return;
      }
      if (parentId) {
        toggleFolder(parentId, true);
      }
      await updateFolder(id, { parentId });
    },
    [toggleFolder, updateFolder]
  );

  const createDrawing = useCallback(
    async (folderId: string | null, options: CreateDrawingOptions = {}) => {
      const now = Date.now();
      const kind = options.kind ?? "board";
      const drawing: Drawing = {
        id: createId(),
        name:
          options.name?.trim() ||
          (kind === "note" ? t("common.untitledNote") : t("common.untitledBoard")),
        folderId,
        kind,
        createdAt: now,
        updatedAt: now,
      };
      await NotesDb.createFile(
        drawing,
        kind === "note"
          ? { note: { id: drawing.id, content: options.content ?? "" } }
          : {
              scene: options.scene
                ? { ...options.scene, id: drawing.id }
                : createEmptyScene(drawing.id),
            }
      );
      setDrawings([...drawingsRef.current, drawing]);
      if (folderId) {
        toggleFolder(folderId, true);
      }
      if (options.open !== false) {
        navigate({ type: "drawing", id: drawing.id });
      }
      return drawing;
    },
    [navigate, setDrawings, t, toggleFolder]
  );

  const updateDrawing = useCallback(
    async (id: string, patch: Partial<Drawing>) => {
      const drawing = drawingsRef.current.find((d) => d.id === id);
      if (!drawing) {
        return;
      }
      const updated = { ...drawing, ...patch, updatedAt: Date.now() };
      replaceDrawing(updated);
      await NotesDb.putDrawing(updated);
    },
    [replaceDrawing]
  );

  const renameDrawing = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      const drawing = drawingsRef.current.find((d) => d.id === id);
      if (drawing && trimmed && trimmed !== drawing.name) {
        await updateDrawing(id, { name: trimmed });
      }
    },
    [updateDrawing]
  );

  const deleteDrawing = useCallback(
    (id: string) => deleteItems([{ type: "drawing", id }]),
    [deleteItems]
  );

  const moveDrawing = useCallback(
    async (id: string, folderId: string | null) => {
      const drawing = drawingsRef.current.find((d) => d.id === id);
      if (!drawing || drawing.folderId === folderId) {
        return;
      }
      if (folderId) {
        toggleFolder(folderId, true);
      }
      await updateDrawing(id, { folderId });
    },
    [toggleFolder, updateDrawing]
  );

  const duplicateDrawing = useCallback(
    async (id: string) => {
      const drawing = drawingsRef.current.find((d) => d.id === id);
      if (!drawing) {
        return null;
      }
      const name = t("common.copySuffix", { name: drawing.name });
      if (getFileKind(drawing) === "note") {
        const note = await NotesDb.getNote(id);
        const copy = await createDrawing(drawing.folderId, {
          kind: "note",
          name,
          open: false,
        });
        // Images belong to one note — the copy gets its own.
        const content = await copyAttachments(id, copy.id, note?.content ?? "");
        await NotesDb.saveNote({ id: copy.id, content }, copy);
        return copy;
      }
      const scene = await NotesDb.getScene(id);
      return createDrawing(drawing.folderId, {
        name,
        scene: scene ?? undefined,
        open: false,
      });
    },
    [createDrawing, t]
  );

  const downloadDrawing = useCallback(async (id: string) => {
    const drawing = drawingsRef.current.find((d) => d.id === id);
    if (!drawing) {
      return;
    }
    if (getFileKind(drawing) === "note") {
      const note = await NotesDb.getNote(id);
      // Embedded images go into the file as data URLs, so it stays self-contained.
      const content = await inlineAttachments(id, note?.content ?? "");
      downloadFile(
        new Blob([content], { type: "text/markdown;charset=utf-8" }),
        `${drawing.name}.md`
      );
      return;
    }
    const scene = await NotesDb.getScene(id);
    if (!scene) {
      return;
    }
    const json = serializeAsJSON(scene.elements, scene.appState, scene.files, "local");
    downloadFile(
      new Blob([json], { type: "application/vnd.excalidraw+json" }),
      `${drawing.name}.excalidraw`
    );
  }, []);

  const exportBackup = useCallback(async () => {
    const backup = await createBackup(await NotesDb.getSnapshot());
    downloadFile(backup, getBackupFileName());
  }, []);

  const restoreBackup = useCallback(
    async (snapshot: NotesSnapshot) => {
      // Close the open file first: its editor flushes pending edits on unmount,
      // and that save must land before the restore, not overwrite it.
      navigate(START);
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      await NotesDb.restoreSnapshot(snapshot);
      const [storedFolders, storedDrawings] = await Promise.all([
        NotesDb.getFolders(),
        NotesDb.getDrawings(),
      ]);
      setFolders(storedFolders);
      setDrawings(storedDrawings);
    },
    [navigate, setDrawings, setFolders]
  );

  const toggleFavorite = useCallback(
    async (item: ItemRef) => {
      // Favoriting is metadata — don't bump updatedAt, which drives "Modified" sorting.
      if (item.type === "folder") {
        const folder = foldersRef.current.find((f) => f.id === item.id);
        if (folder) {
          const updated = {
            ...folder,
            favoritedAt: folder.favoritedAt ? null : Date.now(),
          };
          replaceFolder(updated);
          await NotesDb.putFolder(updated);
        }
        return;
      }
      const drawing = drawingsRef.current.find((d) => d.id === item.id);
      if (drawing) {
        const updated = {
          ...drawing,
          favoritedAt: drawing.favoritedAt ? null : Date.now(),
        };
        replaceDrawing(updated);
        await NotesDb.putDrawing(updated);
      }
    },
    [replaceDrawing, replaceFolder]
  );

  const setItemIcon = useCallback(
    async (item: ItemRef, icon: string | null) => {
      // Like favorites: metadata, so updatedAt (used for sorting) stays as is.
      if (item.type === "folder") {
        const folder = foldersRef.current.find((f) => f.id === item.id);
        if (folder) {
          const updated = { ...folder, icon };
          replaceFolder(updated);
          await NotesDb.putFolder(updated);
        }
        return;
      }
      const drawing = drawingsRef.current.find((d) => d.id === item.id);
      if (drawing) {
        const updated = { ...drawing, icon };
        replaceDrawing(updated);
        await NotesDb.putDrawing(updated);
      }
    },
    [replaceDrawing, replaceFolder]
  );

  const setFileIconColor = useCallback(
    async (id: string, iconColor: FolderColor | null) => {
      const drawing = drawingsRef.current.find((d) => d.id === id);
      if (drawing) {
        const updated = { ...drawing, iconColor };
        replaceDrawing(updated);
        await NotesDb.putDrawing(updated);
      }
    },
    [replaceDrawing]
  );

  const loadScene = useCallback((id: string) => NotesDb.getScene(id), []);

  const loadNote = useCallback(
    async (id: string) => (await NotesDb.getNote(id))?.content ?? "",
    []
  );

  const saveNote = useCallback(
    async (id: string, content: string) => {
      const drawing = drawingsRef.current.find((d) => d.id === id);
      if (!drawing) {
        return false;
      }
      const updated = { ...drawing, updatedAt: Date.now() };
      replaceDrawing(updated);
      await NotesDb.saveNote({ id, content }, updated);
      return true;
    },
    [replaceDrawing]
  );

  const saveScene = useCallback(
    async (scene: DrawingScene) => {
      const drawing = drawingsRef.current.find((d) => d.id === scene.id);
      if (!drawing) {
        return false;
      }
      const updated = { ...drawing, updatedAt: Date.now() };
      replaceDrawing(updated);
      await NotesDb.saveScene(scene, updated);
      return true;
    },
    [replaceDrawing]
  );

  const activeDrawingId = route.type === "drawing" ? route.id : null;

  const value = useMemo<NotesContextValue>(
    () => ({
      isLoaded,
      folders,
      drawings,
      expandedFolderIds,
      route,
      navigate,
      activeDrawingId,
      createFolder,
      renameFolder,
      setFolderColor,
      deleteFolder,
      moveFolder,
      toggleFolder,
      createDrawing,
      renameDrawing,
      deleteDrawing,
      moveDrawing,
      duplicateDrawing,
      downloadDrawing,
      exportBackup,
      restoreBackup,
      toggleFavorite,
      setItemIcon,
      setFileIconColor,
      deleteItems,
      loadScene,
      saveScene,
      loadNote,
      saveNote,
    }),
    [
      isLoaded,
      folders,
      drawings,
      expandedFolderIds,
      route,
      navigate,
      activeDrawingId,
      createFolder,
      renameFolder,
      setFolderColor,
      deleteFolder,
      moveFolder,
      toggleFolder,
      createDrawing,
      renameDrawing,
      deleteDrawing,
      moveDrawing,
      duplicateDrawing,
      downloadDrawing,
      exportBackup,
      restoreBackup,
      toggleFavorite,
      setItemIcon,
      setFileIconColor,
      deleteItems,
      loadScene,
      saveScene,
      loadNote,
      saveNote,
    ]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
});
NotesProvider.displayName = "NotesProvider";

export { NotesProvider };
