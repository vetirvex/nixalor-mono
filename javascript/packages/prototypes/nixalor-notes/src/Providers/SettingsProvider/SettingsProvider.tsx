import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { detectLanguage } from "../../Shared/I18n/I18nContext";
import { I18nProvider } from "../../Shared/I18n/I18nProvider";
import { LocalSettings } from "../../Shared/Storage/LocalSettings";
import { applyFavicon } from "../../Shared/Utils/favicon";
import { ACCENT_COLORS, SettingsContext } from "./SettingsContext";
import type {
  ResolvedTheme,
  Settings,
  SettingsContextValue,
  SettingsProviderProps,
} from "./SettingsTypes";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const getDefaults = (): Settings => ({
  themeMode: "dark",
  accent: "yellow",
  language: detectLanguage(),
  compact: false,
  boardFont: "normal",
});

/** Merges stored values over defaults, dropping anything unknown or malformed. */
const loadSettings = (): Settings => {
  const defaults = getDefaults();
  const stored = LocalSettings.getSettings();
  return {
    themeMode: ["system", "light", "dark"].includes(String(stored.themeMode))
      ? (stored.themeMode as Settings["themeMode"])
      : defaults.themeMode,
    accent:
      stored.accent && stored.accent in ACCENT_COLORS ? stored.accent : defaults.accent,
    language:
      stored.language === "ru" || stored.language === "en"
        ? stored.language
        : defaults.language,
    compact: typeof stored.compact === "boolean" ? stored.compact : defaults.compact,
    boardFont: ["hand", "normal", "mono"].includes(String(stored.boardFont))
      ? (stored.boardFont as Settings["boardFont"])
      : defaults.boardFont,
  };
};

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia(DARK_QUERY).matches ? "dark" : "light";

const SettingsProvider = memo<SettingsProviderProps>(({ children }) => {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const theme = settings.themeMode === "system" ? systemTheme : settings.themeMode;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.accent = settings.accent;
    root.dataset.density = settings.compact ? "compact" : "comfortable";
  }, [theme, settings.accent, settings.compact]);

  // The tab icon follows the accent color too.
  useEffect(() => {
    applyFavicon(settings.accent);
  }, [settings.accent]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      LocalSettings.setSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const defaults = getDefaults();
    LocalSettings.setSettings(defaults);
    setSettings(defaults);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, theme, updateSettings, resetSettings }),
    [settings, theme, updateSettings, resetSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      <I18nProvider language={settings.language}>{children}</I18nProvider>
    </SettingsContext.Provider>
  );
});
SettingsProvider.displayName = "SettingsProvider";

export { SettingsProvider };
