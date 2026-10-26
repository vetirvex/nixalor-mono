import type { Drawing } from "../../Shared/Storage/StorageTypes";

interface FileActionsMenuProps {
  file: Drawing;
  /** Starts inline renaming in the top bar. */
  onRename: () => void;
  /** Boards only: opens Excalidraw's "Export image" dialog. */
  onExportImage?: () => void;
  /** Notes only: export to PDF via the print dialog. */
  onExportPdf?: () => void;
}

export type { FileActionsMenuProps };
