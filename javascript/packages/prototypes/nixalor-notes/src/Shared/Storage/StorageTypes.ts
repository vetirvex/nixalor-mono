import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

type FolderColor =
  "orange" | "blue" | "pink" | "purple" | "green" | "teal" | "yellow" | "gray";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  /** Older records have no color; read through `getFolderColor`. */
  color?: FolderColor;
  /** Set while the folder is starred; also orders the favorites list. */
  favoritedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

/** "board" = Excalidraw drawing, "note" = Markdown note. */
type FileKind = "board" | "note";

/**
 * A file in the tree — a board or a note (the name predates notes).
 * Read the kind through `getFileKind`: older records have none and are boards.
 */
interface Drawing {
  id: string;
  name: string;
  folderId: string | null;
  kind?: FileKind;
  favoritedAt?: number | null;
  /** Last time the board was opened — powers "Recent". */
  openedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

type SavedAppState = Pick<
  AppState,
  "viewBackgroundColor" | "scrollX" | "scrollY" | "zoom" | "gridModeEnabled"
>;

/** Heavy part of a drawing, kept in its own store so the tree loads fast. */
interface DrawingScene {
  id: string;
  elements: readonly OrderedExcalidrawElement[];
  appState: SavedAppState;
  files: BinaryFiles;
}

/** Markdown text of a note, stored apart from the tree like board scenes. */
interface NoteContent {
  id: string;
  content: string;
}

/**
 * An image pasted or dropped into a note. Stored per note and never shown in
 * the tree; the note references it as `attachment:<id>`.
 */
interface Attachment {
  id: string;
  noteId: string;
  blob: Blob;
}

const getFileKind = (drawing: Pick<Drawing, "kind">): FileKind => drawing.kind ?? "board";

export { getFileKind };
export type {
  Attachment,
  Drawing,
  DrawingScene,
  FileKind,
  Folder,
  FolderColor,
  NoteContent,
  SavedAppState,
};
