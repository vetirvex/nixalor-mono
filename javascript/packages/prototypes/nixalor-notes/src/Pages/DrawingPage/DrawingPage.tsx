import { memo, useRef, useState } from "react";
import { Breadcrumbs } from "../../Components/Breadcrumbs/Breadcrumbs";
import { FileActionsMenu } from "../../Components/FileActionsMenu/FileActionsMenu";
import { SaveStatus } from "../../Components/SaveStatus/SaveStatus";
import { TopBar } from "../../Components/TopBar/TopBar";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { PlusIcon, StarFilledIcon, StarIcon } from "../../Shared/Icons/Icons";
import { Button } from "../../Shared/Ui/Button/Button";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { NameInput } from "../../Shared/Ui/NameInput/NameInput";
import { DrawingEditor } from "./Components/DrawingEditor/DrawingEditor";
import type {
  DrawingEditorHandle,
  SaveStatus as Status,
} from "./Components/DrawingEditor/DrawingEditorTypes";
import classes from "./DrawingPage.module.css";
import type { DrawingPageProps } from "./DrawingPageTypes";

const DrawingPage = memo<DrawingPageProps>(({ drawingId }) => {
  const { t } = useI18n();
  const { drawings, renameDrawing, toggleFavorite } = useNotes();
  const { openCreate } = useLayout();
  const editorRef = useRef<DrawingEditorHandle>(null);
  const [status, setStatus] = useState<Status>("saved");
  const [isRenaming, setIsRenaming] = useState(false);

  const drawing = drawings.find((d) => d.id === drawingId);
  if (!drawing) {
    return null;
  }
  const isFavorite = Boolean(drawing.favoritedAt);

  return (
    <div className={classes.drawingPage}>
      <TopBar
        left={
          <>
            <Breadcrumbs
              folderId={drawing.folderId}
              current={
                isRenaming ? (
                  <NameInput
                    initialValue={drawing.name}
                    onSubmit={(name) => {
                      void renameDrawing(drawing.id, name);
                      setIsRenaming(false);
                    }}
                    onCancel={() => setIsRenaming(false)}
                  />
                ) : (
                  <span
                    className={classes.name}
                    title={t("common.rename")}
                    onDoubleClick={() => setIsRenaming(true)}
                  >
                    {drawing.name}
                  </span>
                )
              }
            />
            <IconButton
              label={
                isFavorite ? t("common.removeFromFavorites") : t("common.addToFavorites")
              }
              size="sm"
              active={isFavorite}
              aria-pressed={isFavorite}
              onClick={() => void toggleFavorite({ type: "drawing", id: drawing.id })}
            >
              {isFavorite ? <StarFilledIcon /> : <StarIcon />}
            </IconButton>
            <SaveStatus status={status} onSave={() => editorRef.current?.save()} />
          </>
        }
        right={
          <>
            <FileActionsMenu
              file={drawing}
              onRename={() => setIsRenaming(true)}
              onExportImage={() => editorRef.current?.openExport()}
            />
            <Button
              variant="primary"
              icon={<PlusIcon size={15} strokeWidth={2.5} />}
              onClick={() => openCreate("board", drawing.folderId)}
            >
              {t("common.create")}
            </Button>
          </>
        }
      />
      <section className={classes.canvas}>
        {/* key remounts Excalidraw so every board gets a fresh scene and history. */}
        <DrawingEditor
          key={drawing.id}
          ref={editorRef}
          drawingId={drawing.id}
          folderId={drawing.folderId}
          name={drawing.name}
          onStatusChange={setStatus}
        />
      </section>
    </div>
  );
});
DrawingPage.displayName = "DrawingPage";

export { DrawingPage };
