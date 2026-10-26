import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Breadcrumbs } from "../../Components/Breadcrumbs/Breadcrumbs";
import { FileActionsMenu } from "../../Components/FileActionsMenu/FileActionsMenu";
import { SaveStatus } from "../../Components/SaveStatus/SaveStatus";
import { TopBar } from "../../Components/TopBar/TopBar";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import {
  EyeIcon,
  OutlineIcon,
  PencilIcon,
  PlusIcon,
  StarFilledIcon,
  StarIcon,
} from "../../Shared/Icons/Icons";
import { LocalSettings } from "../../Shared/Storage/LocalSettings";
import { Button } from "../../Shared/Ui/Button/Button";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { NameInput } from "../../Shared/Ui/NameInput/NameInput";
import { Segmented } from "../../Shared/Ui/Segmented/Segmented";
import { getFolderPath } from "../../Shared/Utils/folderTree";
import { toggleTask } from "../../Shared/Utils/markdown";
import { extractHeadings } from "../../Shared/Utils/outline";
import { MOD_KEY } from "../../Shared/Utils/platform";
import { normalizeName, resolveWikiLink } from "../../Shared/Utils/wikiLinks";
import { NoteEditor } from "./Components/NoteEditor/NoteEditor";
import type { NoteEditorHandle } from "./Components/NoteEditor/NoteEditorTypes";
import type { LinkTarget } from "./Components/NoteEditor/wikiLinkCompletion";
import { NoteOutline } from "./Components/NoteOutline/NoteOutline";
import { NoteReader } from "./Components/NoteReader/NoteReader";
import type { NoteReaderHandle } from "./Components/NoteReader/NoteReaderTypes";
import classes from "./NotePage.module.css";
import type { NoteMode, NotePageProps } from "./NotePageTypes";
import { useNoteContent } from "./useNoteContent";

const NotePage = memo<NotePageProps>(({ noteId }) => {
  const { t } = useI18n();
  const { folders, drawings, navigate, renameDrawing, toggleFavorite, createDrawing } =
    useNotes();
  const { openCreate } = useLayout();
  const { content, status, update, save } = useNoteContent(noteId);
  const editorRef = useRef<NoteEditorHandle>(null);
  const [mode, setMode] = useState<NoteMode>("edit");
  const [isRenaming, setIsRenaming] = useState(false);
  const readerRef = useRef<NoteReaderHandle>(null);
  const [isOutlineOpen, setIsOutlineOpen] = useState(LocalSettings.getOutlineOpen);
  const [foldedKeys, setFoldedKeys] = useState<ReadonlySet<string>>(
    () => new Set(LocalSettings.getNoteFolds(noteId))
  );
  const [topLine, setTopLine] = useState(1);
  const [readerActiveIndex, setReaderActiveIndex] = useState(0);

  const headings = useMemo(() => extractHeadings(content ?? ""), [content]);

  // Outline highlight: last heading at or above the top of the view.
  const editorActiveIndex = headings.reduce(
    (active, heading, index) => (heading.line <= topLine ? index : active),
    0
  );
  const activeIndex = mode === "read" ? readerActiveIndex : editorActiveIndex;

  const toggleOutline = () => {
    setIsOutlineOpen((open) => {
      LocalSettings.setOutlineOpen(!open);
      return !open;
    });
  };

  const handleFoldsChange = useCallback(
    (keys: string[]) => {
      setFoldedKeys(new Set(keys));
      LocalSettings.setNoteFolds(noteId, keys);
    },
    [noteId]
  );

  // Folding in the reading view: keep the (hidden) editor in sync too.
  const toggleReaderFold = useCallback(
    (key: string) => {
      const next = new Set(foldedKeys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      handleFoldsChange([...next]);
      editorRef.current?.setFoldedKeys(next);
    },
    [foldedKeys, handleFoldsChange]
  );

  const selectHeading = (index: number) => {
    const heading = headings[index];
    if (!heading) {
      return;
    }
    if (mode === "edit") {
      editorRef.current?.scrollToLine(heading.line);
      return;
    }
    // Unfold the sections that contain the heading, then scroll once it's visible.
    const hidden = new Set<string>();
    let level = heading.level;
    for (let i = index - 1; i >= 0; i--) {
      const parent = headings[i];
      if (parent && parent.level < level) {
        level = parent.level;
        if (foldedKeys.has(parent.key)) {
          hidden.add(parent.key);
        }
      }
    }
    if (hidden.size) {
      const next = new Set([...foldedKeys].filter((key) => !hidden.has(key)));
      handleFoldsChange([...next]);
      editorRef.current?.setFoldedKeys(next);
    }
    requestAnimationFrame(() => readerRef.current?.scrollToHeading(index));
  };

  const note = drawings.find((d) => d.id === noteId);

  // Saves bump updatedAt on every file; only names/places matter for links.
  const linkKey = drawings.map((d) => `${d.id}:${d.name}:${d.folderId ?? ""}`).join("|");
  const linkTargets = useMemo<LinkTarget[]>(
    () =>
      drawings
        .filter((d) => d.id !== noteId)
        .map((d) => ({
          name: d.name,
          detail: getFolderPath(d.folderId, folders)
            .map((f) => f.name)
            .join(" / "),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linkKey, folders, noteId]
  );
  const existingNames = useMemo(
    () => new Set(drawings.map((d) => normalizeName(d.name))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linkKey]
  );
  const linkExists = useCallback(
    (target: string) => existingNames.has(normalizeName(target)),
    [existingNames]
  );

  // Like Obsidian: a link to a missing file creates a note with that name.
  const openLink = useCallback(
    (target: string) => {
      const file = resolveWikiLink(target, drawings);
      if (file) {
        navigate({ type: "drawing", id: file.id });
      } else {
        void createDrawing(note?.folderId ?? null, { kind: "note", name: target });
      }
    },
    [createDrawing, drawings, navigate, note?.folderId]
  );

  const imageLabels = useMemo(
    () => ({
      alignLeft: t("note.image.alignLeft"),
      alignCenter: t("note.image.alignCenter"),
      alignRight: t("note.image.alignRight"),
      resetSize: t("note.image.resetSize"),
      resize: t("note.image.resize"),
    }),
    [t]
  );

  const toggleMode = useCallback(() => {
    setMode((current) => (current === "edit" ? "read" : "edit"));
  }, []);

  useEffect(() => {
    if (mode === "edit") {
      editorRef.current?.focus();
    }
  }, [mode]);

  // Cmd/Ctrl+E toggles reading mode, Cmd/Ctrl+S saves right away.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) {
        return;
      }
      if (event.code === "KeyE") {
        event.preventDefault();
        toggleMode();
      } else if (event.code === "KeyS") {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [save, toggleMode]);

  if (!note) {
    return null;
  }
  const isFavorite = Boolean(note.favoritedAt);

  return (
    <div className={classes.notePage}>
      <TopBar
        left={
          <>
            <Breadcrumbs
              folderId={note.folderId}
              current={
                isRenaming ? (
                  <NameInput
                    initialValue={note.name}
                    onSubmit={(name) => {
                      void renameDrawing(note.id, name);
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
                    {note.name}
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
              onClick={() => void toggleFavorite({ type: "drawing", id: note.id })}
            >
              {isFavorite ? <StarFilledIcon /> : <StarIcon />}
            </IconButton>
            <SaveStatus status={status} onSave={save} />
          </>
        }
        right={
          <>
            <IconButton
              label={t("note.toggleOutline")}
              active={isOutlineOpen}
              aria-pressed={isOutlineOpen}
              onClick={toggleOutline}
            >
              <OutlineIcon />
            </IconButton>
            <Segmented<NoteMode>
              label={`${t("note.mode")} (${MOD_KEY}+E)`}
              value={mode}
              onChange={setMode}
              iconOnly
              options={[
                {
                  value: "edit",
                  label: `${t("note.edit")} (${MOD_KEY}+E)`,
                  icon: <PencilIcon size={15} />,
                },
                {
                  value: "read",
                  label: `${t("note.read")} (${MOD_KEY}+E)`,
                  icon: <EyeIcon size={15} />,
                },
              ]}
            />
            <FileActionsMenu file={note} onRename={() => setIsRenaming(true)} />
            <Button
              variant="primary"
              icon={<PlusIcon size={15} strokeWidth={2.5} />}
              onClick={() => openCreate("note", note.folderId)}
            >
              {t("common.create")}
            </Button>
          </>
        }
      />
      <section className={classes.body}>
        <div className={classes.main}>
          {content !== null && (
            <>
              {/* The editor stays mounted in reading mode to keep cursor and undo history. */}
              <div className={classes.layer} hidden={mode !== "edit"}>
                <NoteEditor
                  ref={editorRef}
                  noteId={note.id}
                  initialContent={content}
                  onChange={update}
                  onOpenLink={openLink}
                  linkTargets={linkTargets}
                  linkExists={linkExists}
                  placeholder={t("note.placeholder")}
                  imageLabels={imageLabels}
                  foldLabel={t("note.fold")}
                  initialFoldedKeys={foldedKeys}
                  onFoldsChange={handleFoldsChange}
                  onTopLineChange={setTopLine}
                />
              </div>
              {mode === "read" && (
                <NoteReader
                  ref={readerRef}
                  content={content}
                  headings={headings}
                  foldedKeys={foldedKeys}
                  onToggleFold={toggleReaderFold}
                  foldLabel={t("note.fold")}
                  onActiveHeadingChange={setReaderActiveIndex}
                  linkExists={linkExists}
                  onOpenLink={openLink}
                  onToggleTask={(index) =>
                    editorRef.current?.setContent(toggleTask(content, index))
                  }
                  emptyText={t("note.empty", { shortcut: `${MOD_KEY}+E` })}
                />
              )}
            </>
          )}
        </div>
        {content !== null && (
          <NoteOutline
            isOpen={isOutlineOpen}
            headings={headings}
            activeIndex={activeIndex}
            onSelect={selectHeading}
            title={t("note.outline")}
            emptyText={t("note.outlineEmpty")}
          />
        )}
      </section>
    </div>
  );
});
NotePage.displayName = "NotePage";

export { NotePage };
