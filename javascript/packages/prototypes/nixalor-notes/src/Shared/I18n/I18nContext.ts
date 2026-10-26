import { createContext, useContext } from "react";
import type { I18nContextValue, Language } from "./I18nTypes";

const I18nContext = createContext<I18nContextValue | null>(null);

const useI18n = () => {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
};

const LANGUAGES: { code: Language; label: string; excalidrawCode: string }[] = [
  { code: "ru", label: "Русский", excalidrawCode: "ru-RU" },
  { code: "en", label: "English", excalidrawCode: "en" },
];

const detectLanguage = (): Language =>
  navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";

export { detectLanguage, I18nContext, LANGUAGES, useI18n };
