import { memo, useId, useState } from "react";
import { AppLogo } from "../../Components/AppLogo/AppLogo";
import {
  ACCENT_COLORS,
  useSettings,
} from "../../Providers/SettingsProvider/SettingsContext";
import type {
  AccentColor,
  BoardFont,
  ThemeMode,
} from "../../Providers/SettingsProvider/SettingsTypes";
import { LANGUAGES, useI18n } from "../../Shared/I18n/I18nContext";
import type { Language, MessageKey } from "../../Shared/I18n/I18nTypes";
import { CloseIcon, KeyboardIcon, PaletteIcon, SaveIcon } from "../../Shared/Icons/Icons";
import { Button } from "../../Shared/Ui/Button/Button";
import { ColorSwatches } from "../../Shared/Ui/ColorSwatches/ColorSwatches";
import { Dialog } from "../../Shared/Ui/Dialog/Dialog";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { Kbd } from "../../Shared/Ui/Kbd/Kbd";
import { Segmented } from "../../Shared/Ui/Segmented/Segmented";
import { MOD_KEY } from "../../Shared/Utils/platform";
import { DataSection } from "./Components/DataSection/DataSection";
import classes from "./SettingsDialogWidget.module.css";
import type {
  SettingsDialogWidgetProps,
  SettingsSection,
} from "./SettingsDialogWidgetTypes";

const THEME_MODES: ThemeMode[] = ["dark", "light", "system"];
const ACCENTS = Object.keys(ACCENT_COLORS) as AccentColor[];
const BOARD_FONTS: BoardFont[] = ["hand", "normal", "mono"];
const SECTION_TITLES: Record<SettingsSection, MessageKey> = {
  appearance: "settings.appearance",
  shortcuts: "settings.shortcuts",
  data: "settings.data",
};

const SettingsDialogWidget = memo<SettingsDialogWidgetProps>(({ onClose }) => {
  const { t } = useI18n();
  const { settings, updateSettings, resetSettings } = useSettings();
  const [section, setSection] = useState<SettingsSection>("appearance");
  const titleId = useId();
  const languageId = useId();

  const shortcuts = [
    { label: t("shortcuts.palette"), keys: `${MOD_KEY} K` },
    { label: t("shortcuts.sidebar"), keys: `${MOD_KEY} \\` },
    { label: t("shortcuts.save"), keys: `${MOD_KEY} S` },
    { label: t("shortcuts.toggleReading"), keys: `${MOD_KEY} E` },
    { label: t("note.exportPdf"), keys: `${MOD_KEY} P` },
    { label: t("shortcuts.bold"), keys: `${MOD_KEY} B / ${MOD_KEY} I` },
    { label: t("shortcuts.createSubmit"), keys: `${MOD_KEY} ↵` },
    { label: t("shortcuts.rename"), keys: "F2" },
  ];

  return (
    <Dialog
      onClose={onClose}
      ariaLabelledBy={titleId}
      width={1200}
      top={48}
      mobileHeight="tall"
      className={classes.dialog}
    >
      <div className={classes.layout}>
        <nav className={classes.nav} aria-label={t("settings.title")}>
          <h1 id={titleId} className={classes.navTitle}>
            {t("settings.title")}
          </h1>
          <span className={classes.navGroup}>{t("settings.section.app")}</span>
          <button
            type="button"
            className={classes.navItem}
            aria-current={section === "appearance" ? "page" : undefined}
            onClick={() => setSection("appearance")}
          >
            <PaletteIcon size={15} />
            {t("settings.appearance")}
          </button>
          <button
            type="button"
            className={classes.navItem}
            data-section="shortcuts"
            aria-current={section === "shortcuts" ? "page" : undefined}
            onClick={() => setSection("shortcuts")}
          >
            <KeyboardIcon size={15} />
            {t("settings.shortcuts")}
          </button>
          <button
            type="button"
            className={classes.navItem}
            aria-current={section === "data" ? "page" : undefined}
            onClick={() => setSection("data")}
          >
            <SaveIcon size={15} />
            {t("settings.data")}
          </button>
        </nav>

        <div className={classes.main}>
          <div className={classes.mainHeader}>
            <h2 className={classes.sectionTitle}>{t(SECTION_TITLES[section])}</h2>
            <IconButton label={t("common.close")} variant="filled" onClick={onClose}>
              <CloseIcon size={18} />
            </IconButton>
          </div>

          {section === "appearance" ? (
            <div className={classes.fields}>
              <section className={classes.field}>
                <h3 className={classes.label}>{t("settings.theme")}</h3>
                <div
                  className={classes.themes}
                  role="radiogroup"
                  aria-label={t("settings.theme")}
                >
                  {THEME_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={settings.themeMode === mode}
                      className={classes.themeCard}
                      onClick={() => updateSettings({ themeMode: mode })}
                    >
                      <span className={classes.themePreview} data-mode={mode} />
                      <span className={classes.themeName}>
                        {t(`settings.theme.${mode}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className={classes.field}>
                <h3 className={classes.label}>{t("settings.accent")}</h3>
                <ColorSwatches<AccentColor>
                  label={t("settings.accent")}
                  value={settings.accent}
                  onChange={(accent) => updateSettings({ accent })}
                  options={ACCENTS.map((accent) => ({
                    value: accent,
                    hex: ACCENT_COLORS[accent],
                    label: t(`accent.${accent}`),
                  }))}
                />
              </section>

              <section className={classes.field}>
                <h3 className={classes.label}>{t("settings.boardFont")}</h3>
                <Segmented<BoardFont>
                  variant="fill"
                  label={t("settings.boardFont")}
                  value={settings.boardFont}
                  onChange={(boardFont) => updateSettings({ boardFont })}
                  options={BOARD_FONTS.map((font) => ({
                    value: font,
                    label: t(`settings.boardFont.${font}`),
                  }))}
                  renderLabel={(option) => (
                    <span className={classes.fontSample} data-font={option.value}>
                      {option.label}
                    </span>
                  )}
                />
              </section>

              <section className={classes.row}>
                <div className={classes.rowText}>
                  <h3 className={classes.label}>{t("settings.compact")}</h3>
                  <p className={classes.hint}>{t("settings.compactHint")}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.compact}
                  aria-label={t("settings.compact")}
                  className={classes.switch}
                  onClick={() => updateSettings({ compact: !settings.compact })}
                >
                  <span className={classes.switchThumb} />
                </button>
              </section>

              <section className={classes.row}>
                <label htmlFor={languageId} className={classes.label}>
                  {t("settings.language")}
                </label>
                <select
                  id={languageId}
                  className={classes.select}
                  value={settings.language}
                  onChange={(event) =>
                    updateSettings({ language: event.target.value as Language })
                  }
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </section>
            </div>
          ) : section === "data" ? (
            <DataSection />
          ) : (
            <ul className={classes.shortcuts}>
              {shortcuts.map((shortcut) => (
                <li key={shortcut.label} className={classes.shortcut}>
                  <span>{shortcut.label}</span>
                  <Kbd>{shortcut.keys}</Kbd>
                </li>
              ))}
            </ul>
          )}

          <div className={classes.footer}>
            <p className={classes.autosave}>
              <span className={classes.dot} />
              {t("settings.autosave")}
            </p>
            {/* Settings reset only — kept off the Data tab so it isn't read as wiping data. */}
            {section !== "data" ? (
              <Button onClick={resetSettings}>{t("settings.reset")}</Button>
            ) : null}
          </div>
        </div>

        <aside className={classes.previewColumn} aria-label={t("settings.preview")}>
          <span className={classes.previewLabel}>{t("settings.preview")}</span>
          <div className={classes.preview} aria-hidden="true">
            <div className={classes.previewSidebar}>
              <span className={classes.previewWorkspace}>
                <AppLogo size={18} className={classes.previewLogo} />
                {t("app.name")}
              </span>
              <span className={classes.previewItem} data-active="true">
                {t("template.system.api")}
              </span>
              <span className={classes.previewItem}>{t("template.userFlow.start")}</span>
              <span className={classes.previewItem}>{t("template.retro.good")}</span>
            </div>
            <div className={classes.previewCanvas}>
              <span className={classes.previewButton}>{t("common.create")}</span>
              <span className={classes.previewBox} data-font={settings.boardFont}>
                {t("template.system.client")}
              </span>
              <svg
                className={classes.previewArrow}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path d="M10 0 C 20 60, 60 70, 95 100" />
              </svg>
              <span
                className={classes.previewBox}
                data-font={settings.boardFont}
                data-accent="true"
              >
                {t("template.system.api")}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </Dialog>
  );
});
SettingsDialogWidget.displayName = "SettingsDialogWidget";

export { SettingsDialogWidget };
