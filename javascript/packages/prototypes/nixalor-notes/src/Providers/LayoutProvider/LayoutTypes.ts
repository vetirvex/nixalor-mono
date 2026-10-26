import type { ReactNode } from "react";
import type { MenuAnchor } from "../../Shared/Ui/Menu/MenuTypes";
import type { ItemRef } from "../NotesProvider/NotesTypes";

type CreateTab = "board" | "note" | "folder";

/** At most one app dialog is open at a time. */
type DialogState =
  | { type: "palette" }
  | { type: "create"; tab: CreateTab; folderId: string | null }
  | { type: "settings" }
  | { type: "move"; items: ItemRef[] }
  /** Icon picker popover, anchored where it was opened from. */
  | { type: "icon"; item: ItemRef; anchor: MenuAnchor }
  | null;

interface LayoutContextValue {
  /** Phone layout: drawer sidebar, bottom tab bar, sheet dialogs. */
  isMobile: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  dialog: DialogState;
  openPalette: () => void;
  openCreate: (tab: CreateTab, folderId: string | null) => void;
  openSettings: () => void;
  openMove: (items: ItemRef[]) => void;
  openIconPicker: (item: ItemRef, anchor: MenuAnchor) => void;
  closeDialog: () => void;
}

interface LayoutProviderProps {
  children: ReactNode;
}

export type { CreateTab, DialogState, LayoutContextValue, LayoutProviderProps };
