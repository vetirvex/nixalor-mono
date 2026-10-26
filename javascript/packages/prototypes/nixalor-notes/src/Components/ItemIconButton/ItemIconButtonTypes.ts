import type { ReactNode } from "react";
import type { ItemRef } from "../../Providers/NotesProvider/NotesTypes";

interface ItemIconButtonProps {
  item: ItemRef;
  icon: string | null | undefined;
  fallback: ReactNode;
  size: number;
  color?: string;
}

export type { ItemIconButtonProps };
