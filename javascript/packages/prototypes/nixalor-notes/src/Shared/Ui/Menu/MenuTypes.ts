import type { ReactNode } from "react";

/** Where the menu opens: under an element, or at a pointer position (context menu). */
type MenuAnchor = { element: HTMLElement } | { x: number; y: number };

interface MenuProps {
  anchor: MenuAnchor;
  onClose: () => void;
  align?: "start" | "end";
  minWidth?: number;
  label?: string;
  children: ReactNode;
}

interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
  danger?: boolean;
  shortcut?: string;
  /** Keep the menu open after selecting (e.g. color pickers). */
  keepOpen?: boolean;
}

interface MenuSectionProps {
  label?: string;
  children: ReactNode;
}

export type { MenuAnchor, MenuItemProps, MenuProps, MenuSectionProps };
