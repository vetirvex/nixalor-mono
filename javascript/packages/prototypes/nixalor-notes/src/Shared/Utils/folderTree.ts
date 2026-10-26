import type { Drawing, Folder } from "../Storage/StorageTypes";

/** The folder itself plus every folder nested in it, at any depth. */
const getFolderSubtreeIds = (rootId: string, folders: readonly Folder[]) => {
  const ids = new Set([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const folder of folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        added = true;
      }
    }
  }
  return ids;
};

/** Ancestors from the root down to (and including) the given folder. */
const getFolderPath = (folderId: string | null, folders: readonly Folder[]) => {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: Folder[] = [];
  let current = folderId ? byId.get(folderId) : undefined;
  // The guard protects against cycles in corrupted data.
  while (current && path.length < folders.length) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
};

/** Number of boards anywhere inside the folder (nested folders included). */
const countBoardsInSubtree = (
  folderId: string,
  folders: readonly Folder[],
  drawings: readonly Drawing[]
) => {
  const ids = getFolderSubtreeIds(folderId, folders);
  return drawings.filter((drawing) => drawing.folderId && ids.has(drawing.folderId))
    .length;
};

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

export { byName, countBoardsInSubtree, getFolderPath, getFolderSubtreeIds };
