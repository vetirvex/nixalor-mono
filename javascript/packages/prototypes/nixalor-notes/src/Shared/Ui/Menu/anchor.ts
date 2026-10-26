import type { MenuAnchor } from "./MenuTypes";

/**
 * Freezes an anchor to a screen point. Use it when a menu hands off to another
 * popover: the trigger (e.g. a hover-only "⋯" button) may be hidden by then.
 */
const toPointAnchor = (anchor: MenuAnchor): MenuAnchor => {
  if (!("element" in anchor)) {
    return anchor;
  }
  const rect = anchor.element.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom + 4 };
};

export { toPointAnchor };
