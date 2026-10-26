import type { ReactNode } from "react";
import type { ru } from "./locales/ru";

type Language = "ru" | "en";

type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

type MessageKey = keyof typeof ru;

type Messages = Record<MessageKey, string | PluralForms>;

type MessageParams = Record<string, string | number>;

interface I18nContextValue {
  language: Language;
  /** `{name}` placeholders are filled from params; plural messages need `count`. */
  t: (key: MessageKey, params?: MessageParams) => string;
  formatRelativeTime: (timestamp: number) => string;
}

interface I18nProviderProps {
  language: Language;
  children: ReactNode;
}

export type {
  I18nContextValue,
  I18nProviderProps,
  Language,
  MessageKey,
  MessageParams,
  Messages,
  PluralForms,
};
