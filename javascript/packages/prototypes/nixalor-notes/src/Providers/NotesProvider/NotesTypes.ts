import type { ReactNode } from "react";
import type {
  Drawing,
  DrawingScene,
  FileKind,
  Folder,
  FolderColor,
} from "../../Shared/Storage/StorageTypes";

/** What the main area shows. Persisted, so a reload returns to the same place. */
type Route =
  /** Nothing selected — an empty state with a "Create board" button. */
  | { type: "start" }
  | { type: "favorites" }
  | { type: "folder"; id: string }
  | { type: "drawing"; id: string };

type ItemRef = { type: "folder" | "drawing"; id: string };

interface CreateFolderOptions {
  name?: string;
  color?: FolderColor;
}

interface CreateDrawingOptions {
  /** Defaults to "board". */
  kind?: FileKind;
  name?: string;
  /** Initial board content, e.g. from a template or an imported file. */
  scene?: Omit<DrawingScene, "id">;
  /** Initial note text. */
  content?: string;
  /** Open the new board right away (default true). */
  open?: boolean;
}

interface NotesContextValue {
  isLoaded: boolean;
  folders: Folder[];
  drawings: Drawing[];
  expandedFolderIds: ReadonlySet<string>;

  route: Route;
  navigate: (route: Route) => void;
  /** Board shown in the editor, derived from the route. */
  activeDrawingId: string | null;

  createFolder: (
    parentId: string | null,
    options?: CreateFolderOptions
  ) => Promise<Folder>;
  renameFolder: (id: string, name: string) => Promise<void>;
  setFolderColor: (id: string, color: FolderColor) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  /** Moves a folder under another folder (null = root). Ignores moves into itself. */
  moveFolder: (id: string, parentId: string | null) => Promise<void>;
  toggleFolder: (id: string, expanded?: boolean) => void;

  createDrawing: (
    folderId: string | null,
    options?: CreateDrawingOptions
  ) => Promise<Drawing>;
  renameDrawing: (id: string, name: string) => Promise<void>;
  deleteDrawing: (id: string) => Promise<void>;
  moveDrawing: (id: string, folderId: string | null) => Promise<void>;
  duplicateDrawing: (id: string) => Promise<Drawing | null>;
  downloadDrawing: (id: string) => Promise<void>;

  toggleFavorite: (item: ItemRef) => Promise<void>;
  /** Sets a custom icon ("icon:Rocket" / "emoji:🚀"); null restores the default. */
  setItemIcon: (item: ItemRef, icon: string | null) => Promise<void>;
  /** Board/note icon color; null = neutral. (Folders use setFolderColor.) */
  setFileIconColor: (id: string, color: FolderColor | null) => Promise<void>;
  /** Deletes boards and folders (with their content) in one go. */
  deleteItems: (items: ItemRef[]) => Promise<void>;

  loadScene: (id: string) => Promise<DrawingScene | null>;
  loadNote: (id: string) => Promise<string>;
  /** Returns false when the note no longer exists (e.g. it was deleted). */
  saveNote: (id: string, content: string) => Promise<boolean>;
  /** Returns false when the drawing no longer exists (e.g. it was deleted). */
  saveScene: (scene: DrawingScene) => Promise<boolean>;
}

interface NotesProviderProps {
  children: ReactNode;
}

export type {
  CreateDrawingOptions,
  CreateFolderOptions,
  ItemRef,
  NotesContextValue,
  NotesProviderProps,
  Route,
};
