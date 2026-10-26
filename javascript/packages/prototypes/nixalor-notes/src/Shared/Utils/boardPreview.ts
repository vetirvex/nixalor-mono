import { exportToSvg } from "@excalidraw/excalidraw";
import { NotesDb } from "../Storage/NotesDb";

const MAX_CACHE = 200;
// Rendered previews keyed by `${id}:${updatedAt}`; null marks an empty board.
const cache = new Map<string, Promise<string | null>>();

const render = async (boardId: string) => {
  const scene = await NotesDb.getScene(boardId);
  if (!scene || scene.elements.length === 0) {
    return null;
  }
  const svg = await exportToSvg({
    elements: scene.elements,
    appState: { exportBackground: false, viewBackgroundColor: "transparent" },
    files: scene.files,
    exportPadding: 16,
    // Fonts stay inlined: an SVG shown through <img> can't load external fonts.
  });
  return URL.createObjectURL(
    new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" })
  );
};

/**
 * Object URL of an SVG preview of a board (null for an empty board).
 * `updatedAt` is part of the cache key, so edits produce a fresh preview.
 */
const getBoardPreviewUrl = (boardId: string, updatedAt: number) => {
  const key = `${boardId}:${updatedAt}`;
  let preview = cache.get(key);
  if (!preview) {
    if (cache.size >= MAX_CACHE) {
      const [oldestKey, oldest] = cache.entries().next().value ?? [];
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
        void oldest?.then((url) => url && URL.revokeObjectURL(url));
      }
    }
    preview = render(boardId).catch(() => null);
    cache.set(key, preview);
  }
  return preview;
};

export { getBoardPreviewUrl };
