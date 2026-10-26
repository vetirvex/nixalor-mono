import type { Drawing } from "../../Shared/Storage/StorageTypes";

type BoardsView = "list" | "tiles";

interface BoardsSectionProps {
  boards: Drawing[];
  view: BoardsView;
}

export type { BoardsSectionProps, BoardsView };
