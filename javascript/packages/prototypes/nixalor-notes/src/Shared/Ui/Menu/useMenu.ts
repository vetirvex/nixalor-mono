import { useCallback, useState } from "react";
import type { MouseEvent } from "react";
import type { MenuAnchor } from "./MenuTypes";

/** Open/close state for a Menu, from a trigger button or a right-click. */
const useMenu = () => {
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);

  const toggleFromEvent = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    const element = event.currentTarget;
    setAnchor((prev) => (prev ? null : { element }));
  }, []);

  const openAtPointer = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchor({ x: event.clientX, y: event.clientY });
  }, []);

  const close = useCallback(() => setAnchor(null), []);

  return { anchor, isOpen: anchor !== null, toggleFromEvent, openAtPointer, close };
};

export { useMenu };
