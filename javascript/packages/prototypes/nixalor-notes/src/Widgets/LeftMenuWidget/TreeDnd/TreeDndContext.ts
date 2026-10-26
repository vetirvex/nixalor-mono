import { createContext, useContext } from "react";
import type { TreeDndContextValue } from "./TreeDndTypes";

const TreeDndContext = createContext<TreeDndContextValue | null>(null);

const useTreeDnd = () => {
  const value = useContext(TreeDndContext);
  if (!value) {
    throw new Error("useTreeDnd must be used inside TreeDndContext");
  }
  return value;
};

export { TreeDndContext, useTreeDnd };
