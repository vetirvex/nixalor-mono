interface BulkBarProps {
  count: number;
  onMove: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export type { BulkBarProps };
