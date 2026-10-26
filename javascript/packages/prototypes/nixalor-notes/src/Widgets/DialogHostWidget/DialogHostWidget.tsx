import { memo } from "react";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { CommandPaletteWidget } from "../CommandPaletteWidget/CommandPaletteWidget";
import { CreateDialogWidget } from "../CreateDialogWidget/CreateDialogWidget";
import { IconPickerWidget } from "../IconPickerWidget/IconPickerWidget";
import { MoveDialogWidget } from "../MoveDialogWidget/MoveDialogWidget";
import { SettingsDialogWidget } from "../SettingsDialogWidget/SettingsDialogWidget";
import type { DialogHostWidgetProps } from "./DialogHostWidgetTypes";

/** Renders whichever app dialog is open (see LayoutProvider). */
const DialogHostWidget = memo<DialogHostWidgetProps>(() => {
  const { dialog, closeDialog } = useLayout();

  switch (dialog?.type) {
    case "palette":
      return <CommandPaletteWidget onClose={closeDialog} />;
    case "create":
      return (
        <CreateDialogWidget
          initialTab={dialog.tab}
          initialFolderId={dialog.folderId}
          onClose={closeDialog}
        />
      );
    case "move":
      return <MoveDialogWidget items={dialog.items} onClose={closeDialog} />;
    case "icon":
      return (
        <IconPickerWidget
          item={dialog.item}
          anchor={dialog.anchor}
          onClose={closeDialog}
        />
      );
    case "settings":
      return <SettingsDialogWidget onClose={closeDialog} />;
    default:
      return null;
  }
});
DialogHostWidget.displayName = "DialogHostWidget";

export { DialogHostWidget };
