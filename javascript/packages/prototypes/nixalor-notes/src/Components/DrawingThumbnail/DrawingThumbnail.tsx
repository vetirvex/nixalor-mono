import { exportToSvg } from "@excalidraw/excalidraw";
import { memo, useEffect, useState } from "react";
import { BoardIcon } from "../../Shared/Icons/Icons";
import { NotesDb } from "../../Shared/Storage/NotesDb";
import classes from "./DrawingThumbnail.module.css";
import type { DrawingThumbnailProps } from "./DrawingThumbnailTypes";

const MAX_CACHE = 200;
// Rendered previews keyed by `${id}:${updatedAt}`; null marks an empty board.
const cache = new Map<string, string | null>();

const renderPreview = async (drawingId: string) => {
  const scene = await NotesDb.getScene(drawingId);
  if (!scene || scene.elements.length === 0) {
    return null;
  }
  const svg = await exportToSvg({
    elements: scene.elements,
    appState: { exportBackground: false, viewBackgroundColor: "transparent" },
    files: scene.files,
    exportPadding: 16,
    skipInliningFonts: true,
  });
  return URL.createObjectURL(
    new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" })
  );
};

const DrawingThumbnail = memo<DrawingThumbnailProps>(
  ({ drawingId, updatedAt, className }) => {
    const key = `${drawingId}:${updatedAt}`;
    const [src, setSrc] = useState<string | null | undefined>(() => cache.get(key));

    useEffect(() => {
      if (cache.has(key)) {
        setSrc(cache.get(key));
        return;
      }
      let cancelled = false;
      renderPreview(drawingId)
        .then((url) => {
          if (cache.size >= MAX_CACHE) {
            const oldest = cache.keys().next().value;
            if (oldest !== undefined) {
              const stale = cache.get(oldest);
              if (stale) {
                URL.revokeObjectURL(stale);
              }
              cache.delete(oldest);
            }
          }
          cache.set(key, url);
          if (!cancelled) {
            setSrc(url);
          }
        })
        .catch(() => !cancelled && setSrc(null));
      return () => {
        cancelled = true;
      };
    }, [drawingId, key]);

    return (
      <span className={[classes.drawingThumbnail, className].filter(Boolean).join(" ")}>
        {src ? (
          <img src={src} alt="" className={classes.image} draggable={false} />
        ) : (
          <BoardIcon size={22} className={classes.placeholder} />
        )}
      </span>
    );
  }
);
DrawingThumbnail.displayName = "DrawingThumbnail";

export { DrawingThumbnail };
