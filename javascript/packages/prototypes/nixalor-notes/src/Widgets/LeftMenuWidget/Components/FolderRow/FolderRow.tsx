import { memo } from "react";
import { ColorMark } from "../../../../Components/ColorMark/ColorMark";
import { useNotes } from "../../../../Providers/NotesProvider/NotesContext";
import { getFolderHex } from "../../../../Shared/Utils/folderColors";
import { DrawingRow } from "../DrawingRow/DrawingRow";
import { TreeRow } from "../TreeRow/TreeRow";
import type { FolderRowProps } from "./FolderRowTypes";

const FolderRow = memo<FolderRowProps>(
  ({ folder, depth, tree, editingId, onStartEditing, onStopEditing }) => {
    const { expandedFolderIds, toggleFolder, renameFolder, navigate, route } = useNotes();

    const isExpanded = expandedFolderIds.has(folder.id);
    const subFolders = tree.foldersByParent.get(folder.id) ?? [];
    const drawings = tree.drawingsByFolder.get(folder.id) ?? [];
    const hasChildren = subFolders.length > 0 || drawings.length > 0;

    return (
      <TreeRow
        item={{ type: "folder", id: folder.id }}
        dropFolderId={folder.id}
        depth={depth}
        name={folder.name}
        leading={<ColorMark color={getFolderHex(folder)} />}
        trailing={tree.boardCounts.get(folder.id) || undefined}
        isActive={route.type === "folder" && route.id === folder.id}
        isExpanded={isExpanded}
        isEditing={editingId === folder.id}
        onToggle={() => toggleFolder(folder.id)}
        onOpen={() => {
          navigate({ type: "folder", id: folder.id });
          toggleFolder(folder.id, true);
        }}
        onStartEditing={() => onStartEditing(folder.id)}
        onRename={(name) => void renameFolder(folder.id, name)}
        onStopEditing={onStopEditing}
      >
        {hasChildren && (
          <>
            {subFolders.map((child) => (
              <FolderRow
                key={child.id}
                folder={child}
                depth={depth + 1}
                tree={tree}
                editingId={editingId}
                onStartEditing={onStartEditing}
                onStopEditing={onStopEditing}
              />
            ))}
            {drawings.map((drawing) => (
              <DrawingRow
                key={drawing.id}
                drawing={drawing}
                depth={depth + 1}
                editingId={editingId}
                onStartEditing={onStartEditing}
                onStopEditing={onStopEditing}
              />
            ))}
          </>
        )}
      </TreeRow>
    );
  }
);
FolderRow.displayName = "FolderRow";

export { FolderRow };
