import type { ReactNode } from "react";
import type { Language } from "../../Shared/I18n/I18nTypes";

type ThemeMode = "system" | "light" | "dark";

type ResolvedTheme = "light" | "dark";

type AccentColor = "yellow" | "lime" | "teal" | "pink" | "blue" | "purple";

/** Default font for new text on the board (maps to Excalidraw font families). */
type BoardFont = "hand" | "normal" | "mono";

interface Settings {
  themeMode: ThemeMode;
  accent: AccentColor;
  language: Language;
  compact: boolean;
  boardFont: BoardFont;
}

interface SettingsContextValue {
  settings: Settings;
  /** The theme actually applied to the UI and Excalidraw. */
  theme: ResolvedTheme;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export type {
  AccentColor,
  BoardFont,
  ResolvedTheme,
  Settings,
  SettingsContextValue,
  SettingsProviderProps,
  ThemeMode,
};
