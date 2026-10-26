import type { ItemRef } from "../../Providers/NotesProvider/NotesTypes";

interface MoveDialogWidgetProps {
  items: ItemRef[];
  onClose: () => void;
}

export type { MoveDialogWidgetProps };
