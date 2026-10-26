import { createContext, useContext } from "react";
import type { LayoutContextValue } from "./LayoutTypes";

const LayoutContext = createContext<LayoutContextValue | null>(null);

const useLayout = () => {
  const value = useContext(LayoutContext);
  if (!value) {
    throw new Error("useLayout must be used inside LayoutProvider");
  }
  return value;
};

export { LayoutContext, useLayout };
