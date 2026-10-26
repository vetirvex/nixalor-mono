import type { ReactNode } from "react";

interface BreadcrumbsProps {
  /** Folder whose path is shown; null (root) shows only `current`. */
  folderId: string | null;
  /** Last, non-link crumb (e.g. the board name). */
  current?: ReactNode;
}

export type { BreadcrumbsProps };
