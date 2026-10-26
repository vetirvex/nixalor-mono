import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { SearchIcon } from "../../Shared/Icons/Icons";
import {
  EMOJI_PREFIX,
  EMOJI_SET,
  ICON_PREFIX,
  ICON_SET,
  isEmoji,
} from "../../Shared/Icons/itemIcons";
import type { FolderColor } from "../../Shared/Storage/StorageTypes";
import { Button } from "../../Shared/Ui/Button/Button";
import { ColorSwatches } from "../../Shared/Ui/ColorSwatches/ColorSwatches";
import type { ColorSwatchOption } from "../../Shared/Ui/ColorSwatches/ColorSwatchesTypes";
import { usePopover } from "../../Shared/Ui/Popover/usePopover";
import { Segmented } from "../../Shared/Ui/Segmented/Segmented";
import {
  FOLDER_COLOR_KEYS,
  FOLDER_COLORS,
  getFileIconHex,
  getFolderColor,
  getFolderHex,
} from "../../Shared/Utils/folderColors";
import classes from "./IconPickerWidget.module.css";
import type { IconPickerTab, IconPickerWidgetProps } from "./IconPickerWidgetTypes";

const NO_COLOR = "none" as const;

/** Swatch for "no color": a crossed-out neutral circle. */
const NO_COLOR_SWATCH =
  "linear-gradient(135deg, transparent 44%, var(--danger) 44% 56%, transparent 56%), var(--surface-3)";

/** Popover to pick an icon (or emoji) and its color for a board, note or folder. */
const IconPickerWidget = memo<IconPickerWidgetProps>(({ item, anchor, onClose }) => {
  const { t } = useI18n();
  const { folders, drawings, setItemIcon, setFolderColor, setFileIconColor } = useNotes();
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const position = usePopover(panelRef, anchor, "start", onClose);
  const [query, setQuery] = useState("");

  const entity =
    item.type === "folder"
      ? folders.find((f) => f.id === item.id)
      : drawings.find((d) => d.id === item.id);
  const current = entity?.icon ?? null;
  const [tab, setTab] = useState<IconPickerTab>(
    current?.startsWith(EMOJI_PREFIX) ? "emoji" : "icons"
  );
  const folder =
    item.type === "folder" ? folders.find((f) => f.id === item.id) : undefined;
  const file =
    item.type === "drawing" ? drawings.find((d) => d.id === item.id) : undefined;

  // Folders always have a color (it's the folder color); files may stay neutral.
  const colorValue: FolderColor | typeof NO_COLOR = folder
    ? getFolderColor(folder)
    : (file?.iconColor ?? NO_COLOR);
  const colorOptions: ColorSwatchOption<FolderColor | typeof NO_COLOR>[] = [
    ...(folder
      ? []
      : [{ value: NO_COLOR, hex: NO_COLOR_SWATCH, label: t("icon.defaultColor") }]),
    ...FOLDER_COLOR_KEYS.map((key) => ({
      value: key,
      hex: FOLDER_COLORS[key],
      label: t(`color.${key}`),
    })),
  ];
  const tint = folder ? getFolderHex(folder) : getFileIconHex(file);

  const changeColor = (value: FolderColor | typeof NO_COLOR) => {
    if (folder && value !== NO_COLOR) {
      void setFolderColor(folder.id, value);
    } else if (file) {
      void setFileIconColor(file.id, value === NO_COLOR ? null : value);
    }
  };

  useEffect(() => searchRef.current?.focus(), []);

  const icons = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q
      ? ICON_SET.filter((entry) =>
          `${entry.name} ${entry.keywords}`.toLocaleLowerCase().includes(q)
        )
      : ICON_SET;
  }, [query]);

  const typedEmoji = isEmoji(query) ? query.trim() : null;

  const choose = (icon: string | null) => {
    void setItemIcon(item, icon);
    onClose();
  };

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t("icon.title")}
      className={classes.iconPicker}
      style={position}
    >
      <div className={classes.header}>
        <Segmented<IconPickerTab>
          label={t("icon.title")}
          value={tab}
          onChange={setTab}
          options={[
            { value: "icons", label: t("icon.tab.icons") },
            { value: "emoji", label: t("icon.tab.emoji") },
          ]}
        />
      </div>
      <div className={classes.colors}>
        <span className={classes.colorsLabel}>{t("icon.color")}</span>
        <ColorSwatches<FolderColor | typeof NO_COLOR>
          size="sm"
          label={t("icon.color")}
          value={colorValue}
          options={colorOptions}
          onChange={changeColor}
        />
      </div>
      <label className={classes.search}>
        <SearchIcon size={14} />
        <input
          ref={searchRef}
          value={query}
          placeholder={tab === "icons" ? t("icon.search") : t("icon.emojiPlaceholder")}
          aria-label={t("icon.search")}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && typedEmoji) {
              choose(`${EMOJI_PREFIX}${typedEmoji}`);
            }
          }}
        />
      </label>
      <div className={classes.grid} role="listbox" aria-label={t("icon.title")}>
        {typedEmoji && (
          <button
            type="button"
            role="option"
            aria-selected={current === `${EMOJI_PREFIX}${typedEmoji}`}
            className={classes.cell}
            title={typedEmoji}
            onClick={() => choose(`${EMOJI_PREFIX}${typedEmoji}`)}
          >
            <span className={classes.emoji}>{typedEmoji}</span>
          </button>
        )}
        {tab === "icons" &&
          icons.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={current === `${ICON_PREFIX}${name}`}
              className={classes.cell}
              title={name}
              style={{ color: tint }}
              onClick={() => choose(`${ICON_PREFIX}${name}`)}
            >
              <Icon size={18} strokeWidth={2} />
            </button>
          ))}
        {tab === "emoji" &&
          !typedEmoji &&
          EMOJI_SET.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="option"
              aria-selected={current === `${EMOJI_PREFIX}${emoji}`}
              className={classes.cell}
              title={emoji}
              onClick={() => choose(`${EMOJI_PREFIX}${emoji}`)}
            >
              <span className={classes.emoji}>{emoji}</span>
            </button>
          ))}
        {tab === "icons" && icons.length === 0 && !typedEmoji && (
          <p className={classes.empty}>{t("palette.noResults")}</p>
        )}
      </div>
      <div className={classes.footer}>
        <Button
          size="sm"
          variant="ghost"
          disabled={!current}
          onClick={() => choose(null)}
        >
          {t("icon.reset")}
        </Button>
      </div>
    </div>,
    document.body
  );
});
IconPickerWidget.displayName = "IconPickerWidget";

export { IconPickerWidget };
