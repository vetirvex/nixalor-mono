import type { ItemRef } from "../../Providers/NotesProvider/NotesTypes";
import type { MenuAnchor } from "../../Shared/Ui/Menu/MenuTypes";

interface IconPickerWidgetProps {
  item: ItemRef;
  anchor: MenuAnchor;
  onClose: () => void;
}

type IconPickerTab = "icons" | "emoji";

export type { IconPickerTab, IconPickerWidgetProps };
