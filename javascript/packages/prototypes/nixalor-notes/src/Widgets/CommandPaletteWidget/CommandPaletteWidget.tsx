import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { useSettings } from "../../Providers/SettingsProvider/SettingsContext";
import { useImportFile } from "../../Shared/Hooks/useImportFile";
import { useI18n } from "../../Shared/I18n/I18nContext";
import {
  FolderIcon,
  ImportIcon,
  MoonIcon,
  NoteIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SidebarIcon,
  StarIcon,
} from "../../Shared/Icons/Icons";
import { getFileKind } from "../../Shared/Storage/StorageTypes";
import { Dialog } from "../../Shared/Ui/Dialog/Dialog";
import { Kbd } from "../../Shared/Ui/Kbd/Kbd";
import { getFolderHex } from "../../Shared/Utils/folderColors";
import { countBoardsInSubtree, getFolderPath } from "../../Shared/Utils/folderTree";
import { MOD_KEY } from "../../Shared/Utils/platform";
import classes from "./CommandPaletteWidget.module.css";
import type {
  CommandPaletteWidgetProps,
  PaletteResult,
} from "./CommandPaletteWidgetTypes";

const EMPTY_QUERY_LIMIT = 5;
const SEARCH_LIMIT = 8;

const matches = (text: string, query: string) =>
  text.toLocaleLowerCase().includes(query.toLocaleLowerCase());

const CommandPaletteWidget = memo<CommandPaletteWidgetProps>(({ onClose }) => {
  const { t } = useI18n();
  const { folders, drawings, route, navigate, activeDrawingId } = useNotes();
  const { openCreate, openSettings, toggleSidebar } = useLayout();
  const { theme, updateSettings } = useSettings();
  const importFile = useImportFile();
  const [query, setQuery] = useState("");
  const [foldersOnly, setFoldersOnly] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // New items go where the user currently is.
  const contextFolderId =
    route.type === "folder"
      ? route.id
      : (drawings.find((d) => d.id === activeDrawingId)?.folderId ?? null);

  const results = useMemo<PaletteResult[]>(() => {
    const q = query.trim();
    const pathLabel = (folderId: string | null) =>
      getFolderPath(folderId, folders)
        .map((f) => f.name)
        .join(" / ") || t("app.name");
    const folderById = new Map(folders.map((f) => [f.id, f]));

    const boardResults: PaletteResult[] = (
      q
        ? drawings.filter((d) => matches(d.name, q)).slice(0, SEARCH_LIMIT)
        : drawings
            .filter((d) => d.openedAt)
            .sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0))
            .slice(0, EMPTY_QUERY_LIMIT)
    ).map((board) => ({
      key: `board:${board.id}`,
      group: q ? "boards" : "recent",
      icon:
        getFileKind(board) === "note" ? <NoteIcon size={13} /> : <PencilIcon size={13} />,
      iconColor: getFolderHex(board.folderId ? folderById.get(board.folderId) : null),
      title: board.name,
      subtitle: pathLabel(board.folderId),
      run: () => navigate({ type: "drawing", id: board.id }),
    }));

    const folderResults: PaletteResult[] = (
      q
        ? folders.filter((f) => matches(f.name, q))
        : [...folders].sort((a, b) => b.updatedAt - a.updatedAt)
    )
      .slice(0, q ? SEARCH_LIMIT : EMPTY_QUERY_LIMIT)
      .map((folder) => ({
        key: `folder:${folder.id}`,
        group: "folders",
        icon: <FolderIcon size={13} strokeWidth={2.5} />,
        iconBackground: getFolderHex(folder),
        iconColor: "var(--on-accent)",
        title: folder.name,
        subtitle: `${folder.parentId ? pathLabel(folder.parentId) : t("app.name")} · ${t(
          "count.files",
          { count: countBoardsInSubtree(folder.id, folders, drawings) }
        )}`,
        run: () => navigate({ type: "folder", id: folder.id }),
      }));

    const actions: PaletteResult[] = [
      {
        key: "new-board",
        icon: <PlusIcon size={14} strokeWidth={2.5} />,
        title: t("palette.cmd.newBoard"),
        run: () => openCreate("board", contextFolderId),
      },
      {
        key: "new-note",
        icon: <NoteIcon size={13} strokeWidth={2.5} />,
        title: t("palette.cmd.newNote"),
        run: () => openCreate("note", contextFolderId),
      },
      {
        key: "new-folder",
        icon: <FolderIcon size={13} strokeWidth={2.5} />,
        title: t("palette.cmd.newFolder"),
        run: () => openCreate("folder", contextFolderId),
      },
      {
        key: "import",
        icon: <ImportIcon size={13} strokeWidth={2.5} />,
        title: t("palette.cmd.import"),
        run: () => void importFile(contextFolderId),
      },
      {
        key: "favorites",
        icon: <StarIcon size={13} strokeWidth={2.5} />,
        title: t("palette.cmd.favorites"),
        run: () => navigate({ type: "favorites" }),
      },
      {
        key: "theme",
        icon: <MoonIcon size={13} strokeWidth={2.5} />,
        title: t("palette.cmd.toggleTheme"),
        run: () => updateSettings({ themeMode: theme === "dark" ? "light" : "dark" }),
      },
      {
        key: "sidebar",
        icon: <SidebarIcon size={13} strokeWidth={2.5} />,
        title: t("palette.cmd.toggleSidebar"),
        shortcut: `${MOD_KEY} \\`,
        run: toggleSidebar,
      },
      {
        key: "settings",
        icon: <SettingsIcon size={13} strokeWidth={2.5} />,
        title: t("palette.cmd.settings"),
        run: openSettings,
      },
    ]
      .filter((action) => !q || matches(action.title, q))
      .map((action) => ({
        ...action,
        group: "actions" as const,
        iconBackground: "var(--accent)",
        iconColor: "var(--on-accent)",
        subtitle: t("palette.action"),
      }));

    return foldersOnly ? folderResults : [...boardResults, ...folderResults, ...actions];
  }, [
    query,
    foldersOnly,
    folders,
    drawings,
    contextFolderId,
    navigate,
    openCreate,
    openSettings,
    toggleSidebar,
    importFile,
    updateSettings,
    theme,
    t,
  ]);

  useEffect(() => setActiveIndex(0), [query, foldersOnly]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const run = (result: PaletteResult | undefined) => {
    if (!result) {
      return;
    }
    onClose();
    result.run();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (index) => (index + delta + results.length) % Math.max(results.length, 1)
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[activeIndex]);
    } else if (event.key === "Tab") {
      event.preventDefault();
      setFoldersOnly((value) => !value);
    }
  };

  const GROUP_LABELS = {
    recent: t("palette.recent"),
    boards: t("palette.boards"),
    folders: t("palette.folders"),
    actions: t("palette.actions"),
  };

  return (
    <Dialog onClose={onClose} ariaLabel={t("palette.label")} width={620} top={110}>
      <div className={classes.searchRow}>
        <SearchIcon size={18} className={classes.searchIcon} />
        <input
          type="search"
          className={classes.input}
          placeholder={t("palette.placeholder")}
          aria-label={t("palette.placeholder")}
          aria-controls="palette-results"
          aria-activedescendant={results[activeIndex]?.key}
          value={query}
          data-autofocus
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Kbd>Esc</Kbd>
      </div>
      <div
        ref={listRef}
        id="palette-results"
        role="listbox"
        aria-label={t("palette.label")}
        className={classes.results}
      >
        {results.length === 0 && (
          <p className={classes.noResults}>{t("palette.noResults")}</p>
        )}
        {results.map((result, index) => (
          <Fragment key={result.key}>
            {result.group !== results[index - 1]?.group && (
              <div className={classes.groupLabel}>{GROUP_LABELS[result.group]}</div>
            )}
            <div
              id={result.key}
              role="option"
              aria-selected={index === activeIndex}
              data-index={index}
              className={classes.result}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => run(result)}
            >
              <span
                className={classes.resultIcon}
                style={{ background: result.iconBackground, color: result.iconColor }}
              >
                {result.icon}
              </span>
              <span className={classes.resultText}>
                <span className={classes.resultTitle}>{result.title}</span>
                <span className={classes.resultSubtitle}>{result.subtitle}</span>
              </span>
              {result.shortcut && (
                <span className={classes.shortcut}>{result.shortcut}</span>
              )}
            </div>
          </Fragment>
        ))}
      </div>
      <div className={classes.footer}>
        <span>↑↓ {t("palette.hint.navigate")}</span>
        <span>↵ {t("palette.hint.open")}</span>
        <span>
          Tab — {foldersOnly ? t("palette.hint.all") : t("palette.hint.foldersOnly")}
        </span>
      </div>
    </Dialog>
  );
});
CommandPaletteWidget.displayName = "CommandPaletteWidget";

export { CommandPaletteWidget };
