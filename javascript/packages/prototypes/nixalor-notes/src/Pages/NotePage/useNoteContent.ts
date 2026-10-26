import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatusValue } from "../../Components/SaveStatus/SaveStatusTypes";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { removeUnusedAttachments } from "../../Shared/Utils/attachments";

const AUTOSAVE_DELAY_MS = 600;

/** Loads a note and autosaves edits (debounced, flushed on leave / Cmd+S). */
const useNoteContent = (noteId: string) => {
  const { loadNote, saveNote } = useNotes();
  const [content, setContent] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatusValue>("saved");
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadNote(noteId)
      .then((text) => {
        // Undo history starts fresh on open, so images removed earlier can go now.
        void removeUnusedAttachments(noteId, text);
        if (!cancelled) {
          setContent(text);
        }
      })
      .catch((error) => {
        console.error("Failed to load note", error);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [noteId, loadNote]);

  const flush = useCallback(async () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    if (pending === null) {
      return;
    }
    pendingRef.current = null;
    setStatus("saving");
    try {
      await saveNote(noteId, pending);
      if (pendingRef.current === null) {
        setStatus("saved");
      }
    } catch (error) {
      console.error("Failed to save note", error);
      pendingRef.current ??= pending;
      setStatus("error");
    }
  }, [noteId, saveNote]);

  const update = useCallback(
    (next: string) => {
      setContent(next);
      pendingRef.current = next;
      setStatus("unsaved");
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    },
    [flush]
  );

  // Don't lose debounced edits when switching files or leaving the page.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        void flush();
      }
    };
    const onPageHide = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      void flush();
    };
  }, [flush]);

  const save = useCallback(() => {
    if (pendingRef.current !== null) {
      void flush();
    } else {
      setStatus("saved");
    }
  }, [flush]);

  return { content, status, update, save };
};

export { useNoteContent };
