import { memo } from "react";
import type { DragEvent, KeyboardEvent, MouseEvent } from "react";
import { ItemMenu } from "../../../../Components/ItemMenu/ItemMenu";
import { useI18n } from "../../../../Shared/I18n/I18nContext";
import { ChevronRightIcon, MoreIcon } from "../../../../Shared/Icons/Icons";
import { IconButton } from "../../../../Shared/Ui/IconButton/IconButton";
import { useMenu } from "../../../../Shared/Ui/Menu/useMenu";
import { NameInput } from "../../../../Shared/Ui/NameInput/NameInput";
import { useTreeDnd } from "../../TreeDnd/TreeDndContext";
import classes from "./TreeRow.module.css";
import type { TreeRowProps } from "./TreeRowTypes";

const INDENT_PX = 16;
const BASE_PADDING_PX = 10;
/** Boards sit one step further in, so their icon lines up under the folder's color mark. */
const BOARD_OFFSET_PX = 18;

const TreeRow = memo<TreeRowProps>(
  ({
    item,
    dropFolderId,
    depth,
    name,
    leading,
    trailing,
    isActive = false,
    isEditing,
    isExpanded,
    onToggle,
    onOpen,
    onStartEditing,
    onRename,
    onStopEditing,
    children,
  }) => {
    const { t } = useI18n();
    const { dragItem, dropTarget, startDrag, endDrag, hover, drop } = useTreeDnd();
    const menu = useMenu();

    const isFolder = item.type === "folder";
    const isDragging = dragItem?.id === item.id;
    const isDropTarget = isFolder && dropTarget?.folderId === item.id;
    const paddingLeft =
      BASE_PADDING_PX + depth * INDENT_PX + (isFolder ? 0 : BOARD_OFFSET_PX);

    const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", name);
      // Re-rendering the source synchronously inside dragstart can cancel the drag in Chrome.
      window.setTimeout(() => startDrag(item), 0);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
      if (!dragItem) {
        return;
      }
      event.stopPropagation();
      if (hover(dropFolderId)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      drop(dropFolderId);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen();
      } else if (event.key === "F2") {
        event.preventDefault();
        onStartEditing();
      } else if (isFolder && event.key === "ArrowRight" && !isExpanded) {
        onToggle?.();
      } else if (isFolder && event.key === "ArrowLeft" && isExpanded) {
        onToggle?.();
      }
    };

    const handleChevronClick = (event: MouseEvent) => {
      event.stopPropagation();
      onToggle?.();
    };

    return (
      <li role="treeitem" aria-expanded={isExpanded} aria-selected={isActive}>
        <div
          className={classes.row}
          data-kind={item.type}
          data-active={isActive}
          data-dragging={isDragging}
          data-drop-target={isDropTarget}
          data-menu-open={menu.isOpen}
          style={{ paddingLeft }}
          tabIndex={0}
          draggable={!isEditing}
          onClick={onOpen}
          onDoubleClick={onStartEditing}
          onKeyDown={handleKeyDown}
          onContextMenu={menu.openAtPointer}
          onDragStart={handleDragStart}
          onDragEnd={endDrag}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isFolder && (
            <span
              className={classes.chevron}
              onClick={handleChevronClick}
              aria-hidden="true"
            >
              <ChevronRightIcon size={12} strokeWidth={2.5} data-expanded={isExpanded} />
            </span>
          )}
          <span className={classes.leading}>{leading}</span>
          {isEditing ? (
            <NameInput
              initialValue={name}
              onSubmit={(value) => {
                onRename(value);
                onStopEditing();
              }}
              onCancel={onStopEditing}
            />
          ) : (
            <span className={classes.name} title={name}>
              {name}
            </span>
          )}
          {!isEditing && (
            <>
              {trailing !== undefined && (
                <span className={classes.trailing}>{trailing}</span>
              )}
              <IconButton
                label={t("common.moreActions")}
                size="xs"
                className={classes.more}
                onClick={menu.toggleFromEvent}
                onDoubleClick={(event) => event.stopPropagation()}
              >
                <MoreIcon size={14} />
              </IconButton>
            </>
          )}
        </div>
        {menu.anchor && (
          <ItemMenu
            item={item}
            anchor={menu.anchor}
            onClose={menu.close}
            onRename={onStartEditing}
          />
        )}
        {isExpanded && children && (
          <ul role="group" className={classes.children}>
            {children}
          </ul>
        )}
      </li>
    );
  }
);
TreeRow.displayName = "TreeRow";

export { TreeRow };
