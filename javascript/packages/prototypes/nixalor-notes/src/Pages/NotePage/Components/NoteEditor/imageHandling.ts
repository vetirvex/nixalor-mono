import { EditorView } from "@codemirror/view";
import { getImageFiles, saveImages } from "../../../../Shared/Utils/attachments";

/** Inserts the images on their own lines at `pos`; typing continues on the next line. */
const insertImages = async (
  view: EditorView,
  noteId: string,
  files: File[],
  pos: number
) => {
  const snippets = await saveImages(noteId, files);
  const line = view.state.doc.lineAt(Math.min(pos, view.state.doc.length));
  const prefix = pos > line.from ? "\n" : "";
  const insert = `${prefix}${snippets.join("\n")}\n`;
  view.dispatch({
    changes: { from: pos, insert },
    selection: { anchor: pos + insert.length },
    scrollIntoView: true,
    userEvent: "input.paste",
  });
  view.focus();
};

const hasFiles = (event: DragEvent) =>
  event.dataTransfer?.types.includes("Files") ?? false;

/** Ctrl/Cmd+V and drag & drop of images into a note. */
const imageHandling = (getNoteId: () => string) =>
  EditorView.domEventHandlers({
    paste: (event, view) => {
      const files = getImageFiles(event.clipboardData);
      if (!files.length) {
        return false;
      }
      event.preventDefault();
      void insertImages(view, getNoteId(), files, view.state.selection.main.from);
      return true;
    },
    dragover: (event) => {
      if (!hasFiles(event)) {
        return false;
      }
      // Without this the browser would open the dropped file instead.
      event.preventDefault();
      return true;
    },
    drop: (event, view) => {
      const files = getImageFiles(event.dataTransfer);
      if (!files.length) {
        return false;
      }
      event.preventDefault();
      const pos =
        view.posAtCoords({ x: event.clientX, y: event.clientY }) ??
        view.state.selection.main.head;
      void insertImages(view, getNoteId(), files, pos);
      return true;
    },
  });

export { imageHandling };
