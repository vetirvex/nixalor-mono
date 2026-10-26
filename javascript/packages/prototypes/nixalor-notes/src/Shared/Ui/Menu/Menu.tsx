import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import classes from "./Menu.module.css";
import { MenuCloseContext, useMenuClose } from "./MenuContext";
import type { MenuItemProps, MenuProps, MenuSectionProps } from "./MenuTypes";

const GAP = 4;
const MARGIN = 8;

const Menu = memo<MenuProps>(
  ({ anchor, onClose, align = "start", minWidth = 200, label, children }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Measure after render, then clamp into the viewport (flip up when needed).
    useLayoutEffect(() => {
      const menu = menuRef.current;
      if (!menu) {
        return;
      }
      const { width, height } = menu.getBoundingClientRect();
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
    }, [anchor, align]);

    useEffect(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
      const onPointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (menuRef.current?.contains(target)) {
          return;
        }
        if ("element" in anchor && anchor.element.contains(target)) {
          return; // the trigger toggles the menu itself
        }
        onCloseRef.current();
      };
      const onKey = (event: globalThis.KeyboardEvent) => {
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
    }, [anchor]);

    // Arrow keys move between items, like a native menu.
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }
      event.preventDefault();
      const items = [
        ...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
      ];
      const index = items.indexOf(document.activeElement as HTMLElement);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      items[(index + delta + items.length) % items.length]?.focus();
    };

    return createPortal(
      <MenuCloseContext.Provider value={onClose}>
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          className={classes.menu}
          style={{
            minWidth,
            left: position?.left ?? -9999,
            top: position?.top ?? -9999,
            visibility: position ? "visible" : "hidden",
          }}
          onKeyDown={handleKeyDown}
          onContextMenu={(event) => event.preventDefault()}
        >
          {children}
        </div>
      </MenuCloseContext.Provider>,
      document.body
    );
  }
);
Menu.displayName = "Menu";

const MenuItem = memo<MenuItemProps>(
  ({ icon, label, onSelect, danger = false, shortcut, keepOpen = false }) => {
    const close = useMenuClose();
    return (
      <button
        type="button"
        role="menuitem"
        className={classes.item}
        data-danger={danger}
        onClick={() => {
          if (!keepOpen) {
            close();
          }
          onSelect();
        }}
      >
        <span className={classes.itemIcon}>{icon}</span>
        <span className={classes.itemLabel}>{label}</span>
        {shortcut && <span className={classes.shortcut}>{shortcut}</span>}
      </button>
    );
  }
);
MenuItem.displayName = "MenuItem";

const MenuSection = memo<MenuSectionProps>(({ label, children }) => (
  <div className={classes.section}>
    {label && <div className={classes.sectionLabel}>{label}</div>}
    {children}
  </div>
));
MenuSection.displayName = "MenuSection";

const MenuSeparator = memo(() => <div className={classes.separator} role="separator" />);
MenuSeparator.displayName = "MenuSeparator";

export { Menu, MenuItem, MenuSection, MenuSeparator };
