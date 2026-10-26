import { createContext, useContext } from "react";

const MenuCloseContext = createContext<() => void>(() => undefined);

const useMenuClose = () => useContext(MenuCloseContext);

export { MenuCloseContext, useMenuClose };
