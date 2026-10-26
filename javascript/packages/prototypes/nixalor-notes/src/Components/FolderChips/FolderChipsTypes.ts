import type { Folder } from "../../Shared/Storage/StorageTypes";

interface FolderChipsProps {
  folders: Folder[];
  boardCounts: Map<string, number>;
  onCreate: () => void;
}

interface FolderChipProps {
  folder: Folder;
  count: number;
}

export type { FolderChipProps, FolderChipsProps };
