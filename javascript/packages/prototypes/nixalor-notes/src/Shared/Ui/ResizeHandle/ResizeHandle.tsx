import { memo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import {
  clampPanelWidth,
  getPanelWidth,
  PANEL_SIZES,
  setPanelWidth,
} from "../../Utils/panelWidths";
import classes from "./ResizeHandle.module.css";
import type { ResizeHandleProps } from "./ResizeHandleTypes";

const KEY_STEP = 16;

/** Drag (or ←/→) to resize a side panel; double-click restores the default width. */
const ResizeHandle = memo<ResizeHandleProps>(({ panel, edge, label }) => {
  const [width, setWidth] = useState(() => getPanelWidth(panel));
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  // Pointer-up may run before React re-renders with the last width.
  const widthRef = useRef(width);
  const { min, max, defaultWidth } = PANEL_SIZES[panel];
  // Moving the pointer right widens a panel whose handle is on its right edge.
  const direction = edge === "right" ? 1 : -1;

  const apply = (next: number, persist: boolean) => {
    const clamped = clampPanelWidth(panel, next);
    setPanelWidth(panel, clamped, persist);
    widthRef.current = clamped;
    setWidth(clamped);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startWidth: getPanelWidth(panel) };
    // Turns off the open/close width transitions and text selection while dragging.
    document.documentElement.dataset.resizing = "true";
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag) {
      apply(drag.startWidth + (event.clientX - drag.startX) * direction, false);
    }
  };

  const handlePointerEnd = () => {
    if (!dragRef.current) {
      return;
    }
    dragRef.current = null;
    delete document.documentElement.dataset.resizing;
    setPanelWidth(panel, widthRef.current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      apply(width + delta * direction, true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      apply(event.key === "Home" ? min : max, true);
    }
  };

  return (
    <div
      className={classes.resizeHandle}
      data-edge={edge}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      tabIndex={0}
      title={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onDoubleClick={() => {
        setPanelWidth(panel, null);
        widthRef.current = defaultWidth;
        setWidth(defaultWidth);
      }}
      onKeyDown={handleKeyDown}
    />
  );
});
ResizeHandle.displayName = "ResizeHandle";

export { ResizeHandle };
