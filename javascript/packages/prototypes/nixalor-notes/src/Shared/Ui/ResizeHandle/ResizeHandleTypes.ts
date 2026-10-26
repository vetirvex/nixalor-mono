import type { PanelId } from "../../Utils/panelWidths";

interface ResizeHandleProps {
  panel: PanelId;
  /** Panel edge the handle sits on; dragging away from the panel widens it. */
  edge: "left" | "right";
  label: string;
}

export type { ResizeHandleProps };
