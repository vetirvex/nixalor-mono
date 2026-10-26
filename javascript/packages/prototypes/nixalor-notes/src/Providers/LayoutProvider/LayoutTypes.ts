import type { ReactNode } from "react";
import type { ItemRef } from "../NotesProvider/NotesTypes";

type CreateTab = "board" | "note" | "folder";

/** At most one app dialog is open at a time. */
type DialogState =
  | { type: "palette" }
  | { type: "create"; tab: CreateTab; folderId: string | null }
  | { type: "settings" }
  | { type: "move"; items: ItemRef[] }
  | null;

interface LayoutContextValue {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  dialog: DialogState;
  openPalette: () => void;
  openCreate: (tab: CreateTab, folderId: string | null) => void;
  openSettings: () => void;
  openMove: (items: ItemRef[]) => void;
  closeDialog: () => void;
}

interface LayoutProviderProps {
  children: ReactNode;
}

export type { CreateTab, DialogState, LayoutContextValue, LayoutProviderProps };
