import type { ReactNode } from "react";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  count?: number;
  isActive?: boolean;
  onClick: () => void;
}

export type { NavItemProps };
