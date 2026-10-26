import { useCallback } from "react";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import {
  ACCENT_COLORS,
  useSettings,
} from "../../Providers/SettingsProvider/SettingsContext";
import { getFileKind } from "../Storage/StorageTypes";
import { exportNoteToPdf } from "../Utils/exportNotePdf";
import { normalizeName, resolveWikiLink } from "../Utils/wikiLinks";

/**
 * Exports a note to PDF (print dialog → "Save as PDF"). Pass the live text
 * when the note is open, so unsaved edits are included.
 */
const useExportNotePdf = () => {
  const { drawings, loadNote } = useNotes();
  const { settings } = useSettings();

  return useCallback(
    async (noteId: string, liveContent?: string) => {
      const note = drawings.find((d) => d.id === noteId);
      if (!note) {
        return;
      }
      const names = new Set(drawings.map((d) => normalizeName(d.name)));
      await exportNoteToPdf({
        title: note.name,
        content: liveContent ?? (await loadNote(noteId)),
        accent: ACCENT_COLORS[settings.accent],
        exists: (target) => names.has(normalizeName(target)),
        resolveBoard: (target) => {
          const file = resolveWikiLink(target, drawings);
          return file && getFileKind(file) === "board"
            ? { id: file.id, name: file.name, updatedAt: file.updatedAt }
            : null;
        },
      });
    },
    [drawings, loadNote, settings.accent]
  );
};

export { useExportNotePdf };
