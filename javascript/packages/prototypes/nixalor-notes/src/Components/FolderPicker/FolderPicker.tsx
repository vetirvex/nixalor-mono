import { memo, useMemo } from "react";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import type { Folder } from "../../Shared/Storage/StorageTypes";
import { FOLDER_COLORS, getFolderHex } from "../../Shared/Utils/folderColors";
import { byName } from "../../Shared/Utils/folderTree";
import { ColorMark } from "../ColorMark/ColorMark";
import { ItemIcon } from "../ItemIcon/ItemIcon";
import classes from "./FolderPicker.module.css";
import type { FolderPickerProps } from "./FolderPickerTypes";

const INDENT_PX = 18;

/** Flattens the folder tree depth-first so it can render as an indented list. */
const flatten = (folders: Folder[]) => {
  const byParent = new Map<string | null, Folder[]>();
  for (const folder of folders) {
    const list = byParent.get(folder.parentId) ?? [];
    list.push(folder);
    byParent.set(folder.parentId, list);
  }
  const rows: { folder: Folder; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const folder of [...(byParent.get(parentId) ?? [])].sort(byName)) {
      rows.push({ folder, depth });
      walk(folder.id, depth + 1);
    }
  };
  walk(null, 1);
  return rows;
};

const FolderPicker = memo<FolderPickerProps>(
  ({ value, onChange, label, disabledIds }) => {
    const { folders } = useNotes();
    const { t } = useI18n();
    const rows = useMemo(() => flatten(folders), [folders]);

    return (
      <div className={classes.folderPicker} role="radiogroup" aria-label={label}>
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          className={classes.option}
          onClick={() => onChange(null)}
        >
          <ColorMark color={FOLDER_COLORS.gray} />
          {t("create.root", { workspace: t("app.name") })}
        </button>
        {rows.map(({ folder, depth }) => (
          <button
            key={folder.id}
            type="button"
            role="radio"
            aria-checked={value === folder.id}
            disabled={disabledIds?.has(folder.id)}
            className={classes.option}
            style={{ paddingLeft: 10 + depth * INDENT_PX }}
            onClick={() => onChange(folder.id)}
          >
            <ItemIcon
              icon={folder.icon}
              size={14}
              color={getFolderHex(folder)}
              fallback={<ColorMark color={getFolderHex(folder)} />}
            />
            <span className={classes.name}>{folder.name}</span>
          </button>
        ))}
      </div>
    );
  }
);
FolderPicker.displayName = "FolderPicker";

export { FolderPicker };
