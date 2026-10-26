import type { CreateTab } from "../../Providers/LayoutProvider/LayoutTypes";

interface CreateDialogWidgetProps {
  initialTab: CreateTab;
  initialFolderId: string | null;
  onClose: () => void;
}

export type { CreateDialogWidgetProps };
