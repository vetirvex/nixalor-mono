import type { Drawing } from "../../Shared/Storage/StorageTypes";

interface FileActionsMenuProps {
  file: Drawing;
  /** Starts inline renaming in the top bar. */
  onRename: () => void;
  /** Boards only: opens Excalidraw's "Export image" dialog. */
  onExportImage?: () => void;
}

export type { FileActionsMenuProps };
