import type { ReactNode } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

interface ConfirmProviderProps {
  children: ReactNode;
}

export type { ConfirmFn, ConfirmOptions, ConfirmProviderProps };
