import type { SaveStatusValue as SaveStatus } from "../../../../Components/SaveStatus/SaveStatusTypes";

/** Imperative handle used by the page's top bar. */
interface DrawingEditorHandle {
  save: () => void;
  openExport: () => void;
}

interface DrawingEditorProps {
  drawingId: string;
  /** Imported files land next to the current drawing. */
  folderId: string | null;
  /** Used by Excalidraw as the default file name for exports. */
  name: string;
  onStatusChange: (status: SaveStatus) => void;
}

export type { DrawingEditorHandle, DrawingEditorProps, SaveStatus };
