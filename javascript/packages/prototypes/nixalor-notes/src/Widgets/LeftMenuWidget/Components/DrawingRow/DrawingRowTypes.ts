import type { Drawing } from "../../../../Shared/Storage/StorageTypes";
import type { TreeEditingProps } from "../../LeftMenuWidgetTypes";

interface DrawingRowProps extends TreeEditingProps {
  drawing: Drawing;
  /** Nesting level: 0 for boards at the root, 1 inside a top-level folder, … */
  depth: number;
}

export type { DrawingRowProps };
