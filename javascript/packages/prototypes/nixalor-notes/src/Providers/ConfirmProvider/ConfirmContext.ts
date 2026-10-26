import { createContext, useContext } from "react";
import type { ConfirmFn } from "./ConfirmTypes";

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Promise-based replacement for window.confirm, styled like the app. */
const useConfirm = () => {
  const value = useContext(ConfirmContext);
  if (!value) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }
  return value;
};

export { ConfirmContext, useConfirm };
