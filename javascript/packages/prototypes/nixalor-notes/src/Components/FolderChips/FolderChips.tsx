import { memo } from "react";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { PlusIcon } from "../../Shared/Icons/Icons";
import { useMenu } from "../../Shared/Ui/Menu/useMenu";
import { getFolderHex } from "../../Shared/Utils/folderColors";
import { ColorMark } from "../ColorMark/ColorMark";
import { ItemMenu } from "../ItemMenu/ItemMenu";
import classes from "./FolderChips.module.css";
import type { FolderChipProps, FolderChipsProps } from "./FolderChipsTypes";

const FolderChip = memo<FolderChipProps>(({ folder, count }) => {
  const { navigate } = useNotes();
  const menu = useMenu();
  return (
    <>
      <button
        type="button"
        className={classes.chip}
        onClick={() => navigate({ type: "folder", id: folder.id })}
        onContextMenu={menu.openAtPointer}
      >
        <ColorMark color={getFolderHex(folder)} />
        <span className={classes.name}>{folder.name}</span>
        <span className={classes.count}>{count}</span>
      </button>
      {menu.anchor && (
        <ItemMenu
          item={{ type: "folder", id: folder.id }}
          anchor={menu.anchor}
          onClose={menu.close}
        />
      )}
    </>
  );
});
FolderChip.displayName = "FolderChip";

const FolderChips = memo<FolderChipsProps>(({ folders, boardCounts, onCreate }) => {
  const { t } = useI18n();
  return (
    <div className={classes.folderChips}>
      {folders.map((folder) => (
        <FolderChip
          key={folder.id}
          folder={folder}
          count={boardCounts.get(folder.id) ?? 0}
        />
      ))}
      <button type="button" className={classes.create} onClick={onCreate}>
        <PlusIcon size={14} />
        {t("folder.newFolderChip")}
      </button>
    </div>
  );
});
FolderChips.displayName = "FolderChips";

export { FolderChips };
