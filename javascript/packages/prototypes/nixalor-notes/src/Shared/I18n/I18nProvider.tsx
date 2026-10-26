import { memo, useCallback, useEffect, useMemo } from "react";
import { I18nContext } from "./I18nContext";
import type {
  I18nProviderProps,
  Language,
  MessageKey,
  MessageParams,
  Messages,
} from "./I18nTypes";
import { en } from "./locales/en";
import { ru } from "./locales/ru";

const MESSAGES: Record<Language, Messages> = { ru, en };

const fill = (template: string, params?: MessageParams) =>
  params
    ? template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match
      )
    : template;

const MINUTE = 60_000;
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * MINUTE],
  ["month", 30 * 24 * 60 * MINUTE],
  ["week", 7 * 24 * 60 * MINUTE],
  ["day", 24 * 60 * MINUTE],
  ["hour", 60 * MINUTE],
  ["minute", MINUTE],
];

const I18nProvider = memo<I18nProviderProps>(({ language, children }) => {
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const pluralRules = useMemo(() => new Intl.PluralRules(language), [language]);
  const relativeFormat = useMemo(
    () => new Intl.RelativeTimeFormat(language, { numeric: "auto" }),
    [language]
  );

  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => {
      const message = MESSAGES[language][key];
      if (typeof message === "string") {
        return fill(message, params);
      }
      const count = Number(params?.count ?? 0);
      const form = message[pluralRules.select(count)] ?? message.other;
      return fill(form, params);
    },
    [language, pluralRules]
  );

  const formatRelativeTime = useCallback(
    (timestamp: number) => {
      const diff = timestamp - Date.now();
      if (Math.abs(diff) < MINUTE) {
        return t("time.justNow");
      }
      for (const [unit, size] of UNITS) {
        if (Math.abs(diff) >= size) {
          return relativeFormat.format(Math.round(diff / size), unit);
        }
      }
      return t("time.justNow");
    },
    [relativeFormat, t]
  );

  const value = useMemo(
    () => ({ language, t, formatRelativeTime }),
    [language, t, formatRelativeTime]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
});
I18nProvider.displayName = "I18nProvider";

export { I18nProvider };
