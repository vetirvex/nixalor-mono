import { memo, useEffect, useState } from "react";
import { NoteIcon } from "../../Shared/Icons/Icons";
import { NotesDb } from "../../Shared/Storage/NotesDb";
import { markdownToPreviewText } from "../../Shared/Utils/markdown";
import classes from "./NoteThumbnail.module.css";
import type { NoteThumbnailProps } from "./NoteThumbnailTypes";

const MAX_CACHE = 200;
// First lines of each note keyed by `${id}:${updatedAt}`.
const cache = new Map<string, string[]>();

/** A note preview: its first lines as plain text, like a page miniature. */
const NoteThumbnail = memo<NoteThumbnailProps>(({ noteId, updatedAt, className }) => {
  const key = `${noteId}:${updatedAt}`;
  const [lines, setLines] = useState<string[] | undefined>(() => cache.get(key));

  useEffect(() => {
    const cached = cache.get(key);
    if (cached) {
      setLines(cached);
      return;
    }
    let cancelled = false;
    NotesDb.getNote(noteId)
      .then((note) => {
        const preview = markdownToPreviewText(note?.content ?? "");
        if (cache.size >= MAX_CACHE) {
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) {
            cache.delete(oldest);
          }
        }
        cache.set(key, preview);
        if (!cancelled) {
          setLines(preview);
        }
      })
      .catch(() => !cancelled && setLines([]));
    return () => {
      cancelled = true;
    };
  }, [noteId, key]);

  return (
    <span className={[classes.noteThumbnail, className].filter(Boolean).join(" ")}>
      {lines && lines.length > 0 ? (
        <span className={classes.text}>
          {lines.map((line, index) => (
            <span key={index} className={classes.line}>
              {line}
            </span>
          ))}
        </span>
      ) : (
        <NoteIcon size={22} className={classes.placeholder} />
      )}
    </span>
  );
});
NoteThumbnail.displayName = "NoteThumbnail";

export { NoteThumbnail };
