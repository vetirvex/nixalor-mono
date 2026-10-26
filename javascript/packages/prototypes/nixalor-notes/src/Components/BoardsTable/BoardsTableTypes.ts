import type { Drawing } from "../../Shared/Storage/StorageTypes";

interface BoardsTableProps {
  boards: Drawing[];
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: Set<string>) => void;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
}

interface BoardsTableRowProps {
  board: Drawing;
  isSelected: boolean;
  onToggle: () => void;
  isEditing: boolean;
  onEditingChange: (id: string | null) => void;
}

export type { BoardsTableProps, BoardsTableRowProps };
