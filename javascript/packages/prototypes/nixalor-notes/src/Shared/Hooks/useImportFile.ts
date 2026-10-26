import { loadFromBlob } from "@excalidraw/excalidraw";
import { useCallback } from "react";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../I18n/I18nContext";
import { extractInlineImages } from "../Utils/attachments";
import { buildSceneContent } from "../Utils/scene";

const MARKDOWN_FILE = /\.(md|markdown|txt)$/i;

const stripExtension = (fileName: string) =>
  fileName.replace(/\.(excalidraw|json|md|markdown|txt)$/i, "");

const pickFile = () =>
  new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    // No `accept` filter on purpose: macOS has no system file type for
    // ".excalidraw", so Finder greys those files out. Content is validated instead.
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), {
      once: true,
    });
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });

/**
 * Picks a file and creates a new board (.excalidraw) or note (.md) from it;
 * nothing existing is overwritten.
 */
const useImportFile = () => {
  const { createDrawing, saveNote, navigate } = useNotes();
  const { t } = useI18n();

  return useCallback(
    async (folderId: string | null, name?: string) => {
      const file = await pickFile();
      if (!file) {
        return null;
      }
      const fileName = name?.trim() || stripExtension(file.name);
      try {
        if (MARKDOWN_FILE.test(file.name)) {
          const note = await createDrawing(folderId, {
            kind: "note",
            name: fileName,
            open: false,
          });
          // Inline data-URL images (e.g. from our own export) become attachments.
          await saveNote(note.id, await extractInlineImages(note.id, await file.text()));
          navigate({ type: "drawing", id: note.id });
          return note;
        }
        const data = await loadFromBlob(file, null, null);
        return await createDrawing(folderId, {
          name: fileName,
          scene: buildSceneContent(data.elements, data.appState, data.files),
        });
      } catch (error) {
        console.error("Failed to import file", error);
        window.alert(t("board.importFailed", { name: file.name }));
        return null;
      }
    },
    [createDrawing, navigate, saveNote, t]
  );
};

export { useImportFile };
