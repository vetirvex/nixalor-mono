import { Excalidraw } from "@excalidraw/excalidraw";
import { memo } from "react";
import { CanvasWidgetProps } from "./CanvasWidgetTypes";

const CanvasWidget = memo<CanvasWidgetProps>(() => {
  return <Excalidraw />;
});
CanvasWidget.displayName = "CanvasWidget";

export { CanvasWidget };
