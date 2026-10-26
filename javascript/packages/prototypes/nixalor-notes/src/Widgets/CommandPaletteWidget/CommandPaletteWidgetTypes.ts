import type { ReactNode } from "react";

interface CommandPaletteWidgetProps {
  onClose: () => void;
}

interface PaletteResult {
  key: string;
  group: "recent" | "boards" | "folders" | "actions";
  icon: ReactNode;
  /** Background of the icon tile (folder color, accent for actions). */
  iconBackground?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  shortcut?: string;
  run: () => void;
}

export type { CommandPaletteWidgetProps, PaletteResult };
