import type { Folder, FolderColor } from "../Storage/StorageTypes";

const FOLDER_COLORS: Record<FolderColor, string> = {
  orange: "#f97316",
  blue: "#3b82f6",
  pink: "#ec4899",
  purple: "#8b5cf6",
  green: "#22c55e",
  teal: "#14b8a6",
  yellow: "#facc15",
  gray: "#6b7280",
};

const FOLDER_COLOR_KEYS = Object.keys(FOLDER_COLORS) as FolderColor[];

const getFolderColor = (folder: Folder | null | undefined): FolderColor =>
  folder?.color ?? "gray";

/** Hex color of a folder, or gray for the root. */
const getFolderHex = (folder: Folder | null | undefined) =>
  FOLDER_COLORS[getFolderColor(folder)];

/** Cycles through the palette so sibling folders don't all start the same color. */
const pickNextFolderColor = (existingCount: number): FolderColor =>
  FOLDER_COLOR_KEYS[existingCount % (FOLDER_COLOR_KEYS.length - 1)] ?? "gray";

export {
  FOLDER_COLOR_KEYS,
  FOLDER_COLORS,
  getFolderColor,
  getFolderHex,
  pickNextFolderColor,
};
