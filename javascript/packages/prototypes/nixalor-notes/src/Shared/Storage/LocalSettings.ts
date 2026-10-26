import type { Route } from "../../Providers/NotesProvider/NotesTypes";
import type { Settings } from "../../Providers/SettingsProvider/SettingsTypes";

const PREFIX = "nixalor-notes:";

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(PREFIX + key);
    } else {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    }
  } catch {
    // Storage may be unavailable (private mode, quota) — settings are optional.
  }
};

/** Small UI preferences that live in localStorage. Data lives in IndexedDB. */
const LocalSettings = {
  // Read by the inline script in index.html too — keep the key and shape in sync.
  getSettings: () => read<Partial<Settings>>("settings", {}),
  setSettings: (settings: Settings) => write("settings", settings),

  getRoute: () => read<Route | null>("route", null),
  setRoute: (route: Route) => write("route", route),

  getSidebarOpen: () => read<boolean>("sidebarOpen", true),
  setSidebarOpen: (open: boolean) => write("sidebarOpen", open),

  getExpandedFolderIds: () => read<string[]>("expandedFolderIds", []),
  setExpandedFolderIds: (ids: string[]) => write("expandedFolderIds", ids),

  getOutlineOpen: () => read<boolean>("outlineOpen", true),
  setOutlineOpen: (open: boolean) => write("outlineOpen", open),

  /** Folded heading keys per note (see Shared/Utils/outline). */
  getNoteFolds: (noteId: string) => read<string[]>(`folds:${noteId}`, []),
  setNoteFolds: (noteId: string, keys: string[]) =>
    write(`folds:${noteId}`, keys.length ? keys : null),

  getFolderView: () => read<{ view: string; sort: string } | null>("folderView", null),
  setFolderView: (value: { view: string; sort: string }) => write("folderView", value),
};

export { LocalSettings };
