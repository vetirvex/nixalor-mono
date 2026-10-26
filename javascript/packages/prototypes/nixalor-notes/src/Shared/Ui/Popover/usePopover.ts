import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { MenuAnchor } from "../Menu/MenuTypes";

const GAP = 4;
const MARGIN = 8;

/**
 * Positions a floating panel next to its anchor (an element or a pointer
 * position), keeps it inside the viewport — flipping above when there's no
 * room below — and closes it on outside click, Escape, resize or window blur.
 */
const usePopover = (
  panelRef: RefObject<HTMLElement | null>,
  anchor: MenuAnchor,
  align: "start" | "end",
  onClose: () => void
) => {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Measure after render, then clamp into the viewport.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const { width, height } = panel.getBoundingClientRect();
    let left: number;
    let top: number;
    let flipTop: number;
    if ("element" in anchor) {
      const rect = anchor.element.getBoundingClientRect();
      left = align === "end" ? rect.right - width : rect.left;
      top = rect.bottom + GAP;
      flipTop = rect.top - height - GAP;
    } else {
      left = anchor.x;
      top = anchor.y;
      flipTop = anchor.y - height;
    }
    if (top + height > window.innerHeight - MARGIN && flipTop > MARGIN) {
      top = flipTop;
    }
    left = Math.min(Math.max(MARGIN, left), window.innerWidth - width - MARGIN);
    top = Math.min(Math.max(MARGIN, top), window.innerHeight - height - MARGIN);
    setPosition({ left, top });
  }, [panelRef, anchor, align]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) {
        return;
      }
      if ("element" in anchor && anchor.element.contains(target)) {
        return; // the trigger toggles the panel itself
      }
      onCloseRef.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    const onBlurWindow = () => onCloseRef.current();
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("resize", onBlurWindow);
    window.addEventListener("blur", onBlurWindow);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
      window.removeEventListener("resize", onBlurWindow);
      window.removeEventListener("blur", onBlurWindow);
    };
  }, [panelRef, anchor]);

  /** Inline style for the panel (hidden off-screen until measured). */
  return {
    left: position?.left ?? -9999,
    top: position?.top ?? -9999,
    visibility: position ? ("visible" as const) : ("hidden" as const),
  };
};

export { usePopover };
