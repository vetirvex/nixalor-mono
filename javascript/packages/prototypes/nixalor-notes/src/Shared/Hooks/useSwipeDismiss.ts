import { useEffect } from "react";
import type { RefObject } from "react";

interface SwipeDismissOptions {
  ref: RefObject<HTMLElement | null>;
  /** Direction the panel leaves in: a drawer goes left, a bottom sheet goes down. */
  direction: "left" | "down";
  enabled: boolean;
  onDismiss: () => void;
}

// Movement before we decide whether the gesture is ours or a scroll.
const LOCK_DISTANCE = 10;
const DISMISS_DISTANCE = 80;

const isScrolledDown = (target: Node, container: HTMLElement) => {
  for (
    let node: Node | null = target;
    node && node !== container;
    node = node.parentNode
  ) {
    if (node instanceof HTMLElement && node.scrollTop > 0) {
      return true;
    }
  }
  return container.scrollTop > 0;
};

/**
 * The panel follows the finger in `direction` and closes when released far
 * enough (or flicked); otherwise it springs back.
 */
const useSwipeDismiss = ({ ref, direction, enabled, onDismiss }: SwipeDismissOptions) => {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) {
      return;
    }
    const horizontal = direction === "left";
    let start: { x: number; y: number; time: number } | null = null;
    let state: "pending" | "dragging" | "ignored" = "pending";
    let offset = 0;

    const reset = () => {
      element.style.transform = "";
      element.style.transition = "";
      start = null;
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length > 1) {
        return;
      }
      start = { x: touch.clientX, y: touch.clientY, time: event.timeStamp };
      state = "pending";
      offset = 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!start || !touch || state === "ignored") {
        return;
      }
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (state === "pending") {
        if (Math.hypot(dx, dy) < LOCK_DISTANCE) {
          return;
        }
        const along = horizontal ? -dx : dy;
        const across = horizontal ? Math.abs(dy) : Math.abs(dx);
        // A sheet only drags down when the content under the finger is scrolled to the top.
        const blocked = !horizontal && isScrolledDown(event.target as Node, element);
        state = along > across && !blocked ? "dragging" : "ignored";
        if (state === "ignored") {
          return;
        }
        element.style.transition = "none";
      }
      event.preventDefault();
      offset = Math.max(0, horizontal ? -dx : dy);
      element.style.transform = horizontal
        ? `translateX(${-offset}px)`
        : `translateY(${offset}px)`;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!start || state !== "dragging") {
        start = null;
        return;
      }
      const velocity = offset / Math.max(1, event.timeStamp - start.time);
      const dismiss = offset > DISMISS_DISTANCE || velocity > 0.5;
      reset();
      if (dismiss) {
        onDismiss();
      }
    };

    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd);
    element.addEventListener("touchcancel", reset);
    return () => {
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", reset);
      reset();
    };
  }, [ref, direction, enabled, onDismiss]);
};

export { useSwipeDismiss };
