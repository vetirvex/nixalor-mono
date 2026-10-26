interface FolderPickerProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
  label: string;
  /** Folders that can't be chosen (e.g. a folder being moved and its subfolders). */
  disabledIds?: ReadonlySet<string>;
}

export type { FolderPickerProps };
