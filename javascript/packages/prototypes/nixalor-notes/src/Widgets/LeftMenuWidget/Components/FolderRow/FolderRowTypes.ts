import type { Folder } from "../../../../Shared/Storage/StorageTypes";
import type { NotesTree, TreeEditingProps } from "../../LeftMenuWidgetTypes";

interface FolderRowProps extends TreeEditingProps {
  folder: Folder;
  depth: number;
  tree: NotesTree;
}

export type { FolderRowProps };
