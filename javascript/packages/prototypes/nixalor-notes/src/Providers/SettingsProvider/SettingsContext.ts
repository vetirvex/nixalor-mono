import { createContext, useContext } from "react";
import type { AccentColor, BoardFont, SettingsContextValue } from "./SettingsTypes";

const SettingsContext = createContext<SettingsContextValue | null>(null);

const useSettings = () => {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return value;
};

/** Hex values mirror Tokens.css; used where a raw color is needed (swatches). */
const ACCENT_COLORS: Record<AccentColor, string> = {
  yellow: "#facc15",
  lime: "#a3e635",
  teal: "#5eead4",
  pink: "#fda4af",
  blue: "#3b82f6",
  purple: "#8b5cf6",
};

/** Excalidraw FONT_FAMILY ids: Excalifont, Nunito, Comic Shanns. */
const BOARD_FONT_FAMILY: Record<BoardFont, number> = {
  hand: 5,
  normal: 6,
  mono: 8,
};

export { ACCENT_COLORS, BOARD_FONT_FAMILY, SettingsContext, useSettings };
