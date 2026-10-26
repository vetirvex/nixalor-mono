import type { ReactNode } from "react";

interface TopBarProps {
  /** Rendered after the sidebar toggle (breadcrumbs, title, status). */
  left?: ReactNode;
  right?: ReactNode;
}

export type { TopBarProps };
