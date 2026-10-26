import type { ItemRef } from "../../Providers/NotesProvider/NotesTypes";
import type { MenuAnchor } from "../../Shared/Ui/Menu/MenuTypes";

interface ItemMenuProps {
  item: ItemRef;
  anchor: MenuAnchor;
  onClose: () => void;
  /** Starts inline renaming where the item is shown; hidden when omitted. */
  onRename?: () => void;
  align?: "start" | "end";
}

export type { ItemMenuProps };
