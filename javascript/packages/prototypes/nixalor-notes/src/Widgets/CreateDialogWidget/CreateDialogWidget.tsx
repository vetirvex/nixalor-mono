import { memo, useId, useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { FolderPicker } from "../../Components/FolderPicker/FolderPicker";
import type { CreateTab } from "../../Providers/LayoutProvider/LayoutTypes";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useImportFile } from "../../Shared/Hooks/useImportFile";
import { useI18n } from "../../Shared/I18n/I18nContext";
import {
  ImportIcon,
  NoteIcon,
  PencilIcon,
  TemplateFlowIcon,
  TemplateMindmapIcon,
  TemplateRetroIcon,
  TemplateSystemIcon,
} from "../../Shared/Icons/Icons";
import type { FolderColor } from "../../Shared/Storage/StorageTypes";
import { Button } from "../../Shared/Ui/Button/Button";
import { ColorSwatches } from "../../Shared/Ui/ColorSwatches/ColorSwatches";
import { Dialog, DialogHeader } from "../../Shared/Ui/Dialog/Dialog";
import { Segmented } from "../../Shared/Ui/Segmented/Segmented";
import {
  FOLDER_COLOR_KEYS,
  FOLDER_COLORS,
  pickNextFolderColor,
} from "../../Shared/Utils/folderColors";
import { getFolderPath } from "../../Shared/Utils/folderTree";
import { MOD_KEY } from "../../Shared/Utils/platform";
import { buildTemplateScene } from "../../Shared/Utils/templates";
import type { TemplateId } from "../../Shared/Utils/templates";
import classes from "./CreateDialogWidget.module.css";
import type { CreateDialogWidgetProps } from "./CreateDialogWidgetTypes";

type StartOption = TemplateId | "import";

const BOARD_START_OPTIONS: { id: StartOption; icon: ReactNode }[] = [
  { id: "blank", icon: <PencilIcon size={20} /> },
  { id: "system", icon: <TemplateSystemIcon size={22} /> },
  { id: "userFlow", icon: <TemplateFlowIcon size={22} /> },
  { id: "mindmap", icon: <TemplateMindmapIcon size={22} /> },
  { id: "retro", icon: <TemplateRetroIcon size={22} /> },
  { id: "import", icon: <ImportIcon size={20} /> },
];

const NOTE_START_OPTIONS: { id: StartOption; icon: ReactNode }[] = [
  { id: "blank", icon: <NoteIcon size={20} /> },
  { id: "import", icon: <ImportIcon size={20} /> },
];

const PLACEHOLDER_KEYS = {
  board: "create.boardPlaceholder",
  note: "create.notePlaceholder",
  folder: "create.folderPlaceholder",
} as const;

const SUBMIT_KEYS = {
  board: "create.submitBoard",
  note: "create.submitNote",
  folder: "create.submitFolder",
} as const;

const CreateDialogWidget = memo<CreateDialogWidgetProps>(
  ({ initialTab, initialFolderId, onClose }) => {
    const { t } = useI18n();
    const { folders, createDrawing, createFolder } = useNotes();
    const importFile = useImportFile();
    const titleId = useId();
    const nameId = useId();

    const [tab, setTab] = useState<CreateTab>(initialTab);
    const [name, setName] = useState("");
    const [folderId, setFolderId] = useState<string | null>(initialFolderId);
    const [selectedStart, setStart] = useState<StartOption>("blank");
    const [color, setColor] = useState<FolderColor>(() =>
      pickNextFolderColor(folders.length)
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const startOptions = tab === "note" ? NOTE_START_OPTIONS : BOARD_START_OPTIONS;
    // Board templates don't apply to notes — fall back to a blank note.
    const start = startOptions.some((option) => option.id === selectedStart)
      ? selectedStart
      : "blank";

    const locationLabel = useMemo(() => {
      const path = getFolderPath(folderId, folders).map((f) => f.name);
      return path.length
        ? path.join(" / ")
        : t("create.root", { workspace: t("app.name") });
    }, [folderId, folders, t]);

    const submit = async () => {
      if (isSubmitting) {
        return;
      }
      setIsSubmitting(true);
      try {
        if (tab === "folder") {
          await createFolder(folderId, { name, color });
          onClose();
        } else if (start === "import") {
          onClose();
          await importFile(folderId, name);
        } else if (tab === "note") {
          await createDrawing(folderId, { kind: "note", name });
          onClose();
        } else {
          await createDrawing(folderId, {
            name,
            scene: buildTemplateScene(start, t) ?? undefined,
          });
          onClose();
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();
      void submit();
    };

    // Ctrl/Cmd+Enter submits from anywhere in the dialog, as hinted on the button.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void submit();
      }
    };

    return (
      <Dialog onClose={onClose} ariaLabelledBy={titleId} width={720} top={70}>
        <form className={classes.form} onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <DialogHeader title={t("create.title")} titleId={titleId} onClose={onClose} />
          <div className={classes.tabs}>
            <Segmented<CreateTab>
              variant="tabs"
              label={t("create.title")}
              value={tab}
              onChange={setTab}
              options={[
                { value: "board", label: t("create.tab.board") },
                { value: "note", label: t("create.tab.note") },
                { value: "folder", label: t("create.tab.folder") },
              ]}
            />
          </div>
          <div className={classes.body}>
            <div className={classes.field}>
              <label htmlFor={nameId} className={classes.label}>
                {t("create.name")}
              </label>
              <input
                id={nameId}
                className={classes.input}
                value={name}
                placeholder={t(PLACEHOLDER_KEYS[tab])}
                autoComplete="off"
                data-autofocus
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className={classes.columns}>
              <fieldset className={classes.whereColumn}>
                <legend className={classes.label}>{t("create.where")}</legend>
                <FolderPicker
                  value={folderId}
                  onChange={setFolderId}
                  label={t("create.where")}
                />
              </fieldset>
              {tab !== "folder" ? (
                <fieldset className={classes.startColumn}>
                  <legend className={classes.label}>{t("create.startWith")}</legend>
                  <div className={classes.templates} role="radiogroup">
                    {startOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={start === option.id}
                        className={classes.template}
                        onClick={() => setStart(option.id)}
                      >
                        <span className={classes.templatePreview}>{option.icon}</span>
                        <span className={classes.templateName}>
                          {t(`create.template.${option.id}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {start === "import" && (
                    <p className={classes.hint}>{t("create.importHint")}</p>
                  )}
                </fieldset>
              ) : (
                <fieldset className={classes.startColumn}>
                  <legend className={classes.label}>{t("create.color")}</legend>
                  <ColorSwatches<FolderColor>
                    label={t("create.color")}
                    value={color}
                    onChange={setColor}
                    options={FOLDER_COLOR_KEYS.map((key) => ({
                      value: key,
                      hex: FOLDER_COLORS[key],
                      label: t(`color.${key}`),
                    }))}
                  />
                </fieldset>
              )}
            </div>
          </div>
          <div className={classes.footer}>
            <p className={classes.location}>
              {t("create.willBeCreatedIn")} <strong>{locationLabel}</strong>
            </p>
            <Button onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {t(SUBMIT_KEYS[tab])}
              <span className={classes.submitHint}>{MOD_KEY} ↵</span>
            </Button>
          </div>
        </form>
      </Dialog>
    );
  }
);
CreateDialogWidget.displayName = "CreateDialogWidget";

export { CreateDialogWidget };
