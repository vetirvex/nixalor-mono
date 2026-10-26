import type { ReactNode } from "react";

interface ItemIconProps {
  /** Stored icon value ("icon:Rocket" / "emoji:🚀"); empty shows the fallback. */
  icon: string | null | undefined;
  fallback: ReactNode;
  size?: number;
  /** Tints the icon or the default fallback icon; emoji keep their own colors. */
  color?: string;
}

export type { ItemIconProps };
