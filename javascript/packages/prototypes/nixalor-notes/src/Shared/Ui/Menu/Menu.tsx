import { memo, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { usePopover } from "../Popover/usePopover";
import classes from "./Menu.module.css";
import { MenuCloseContext, useMenuClose } from "./MenuContext";
import type { MenuItemProps, MenuProps, MenuSectionProps } from "./MenuTypes";

const Menu = memo<MenuProps>(
  ({ anchor, onClose, align = "start", minWidth = 200, label, children }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const position = usePopover(menuRef, anchor, align, onClose);

    useEffect(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }, []);

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
          style={{ minWidth, ...position }}
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
