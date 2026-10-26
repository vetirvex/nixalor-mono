import {
  Excalidraw,
  hashElementsVersion,
  MainMenu,
  WelcomeScreen,
} from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  UIOptions,
} from "@excalidraw/excalidraw/types";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useLayout } from "../../../../Providers/LayoutProvider/LayoutContext";
import { useNotes } from "../../../../Providers/NotesProvider/NotesContext";
import {
  BOARD_FONT_FAMILY,
  useSettings,
} from "../../../../Providers/SettingsProvider/SettingsContext";
import type { ThemeMode } from "../../../../Providers/SettingsProvider/SettingsTypes";
import { useImportFile } from "../../../../Shared/Hooks/useImportFile";
import { LANGUAGES, useI18n } from "../../../../Shared/I18n/I18nContext";
import {
  ImportIcon,
  MonitorIcon,
  MoonIcon,
  SaveIcon,
  SidebarIcon,
  SunIcon,
} from "../../../../Shared/Icons/Icons";
import type { DrawingScene } from "../../../../Shared/Storage/StorageTypes";
import { MOD_KEY } from "../../../../Shared/Utils/platform";
import { buildSceneContent } from "../../../../Shared/Utils/scene";
import classes from "./DrawingEditor.module.css";
import type { DrawingEditorHandle, DrawingEditorProps } from "./DrawingEditorTypes";

const AUTOSAVE_DELAY_MS = 800;

// Opening/saving files is handled by the notes tree; the theme is driven by the app.
const UI_OPTIONS: Partial<UIOptions> = {
  canvasActions: {
    loadScene: false,
    saveToActiveFile: false,
    toggleTheme: false,
  },
};

const THEME_ITEMS: { mode: ThemeMode; icon: typeof SunIcon }[] = [
  { mode: "system", icon: MonitorIcon },
  { mode: "light", icon: SunIcon },
  { mode: "dark", icon: MoonIcon },
];

/** Cheap fingerprint of everything worth saving; viewport changes alone don't count. */
const getSceneKey = (
  elements: readonly OrderedExcalidrawElement[],
  appState: Pick<AppState, "viewBackgroundColor" | "gridModeEnabled">,
  files: BinaryFiles
) =>
  [
    hashElementsVersion(elements),
    appState.viewBackgroundColor,
    appState.gridModeEnabled,
    Object.keys(files).length,
  ].join("|");

const DrawingEditor = memo(
  forwardRef<DrawingEditorHandle, DrawingEditorProps>(
    ({ drawingId, folderId, name, onStatusChange }, ref) => {
      const { loadScene, saveScene } = useNotes();
      const { settings, theme, updateSettings } = useSettings();
      const { t, language } = useI18n();
      const { isSidebarOpen, toggleSidebar } = useLayout();
      const importFile = useImportFile();

      const [initialScene, setInitialScene] = useState<DrawingScene | null>(null);
      const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
      const savedKeyRef = useRef<string | null>(null);
      const pendingRef = useRef<{ scene: DrawingScene; key: string } | null>(null);
      const timerRef = useRef<number | null>(null);
      const onStatusChangeRef = useRef(onStatusChange);
      onStatusChangeRef.current = onStatusChange;

      const setStatus = useCallback(
        (status: Parameters<typeof onStatusChange>[0]) =>
          onStatusChangeRef.current(status),
        []
      );

      useEffect(() => {
        let cancelled = false;
        loadScene(drawingId)
          .then((scene) => {
            if (cancelled) {
              return;
            }
            const loaded: DrawingScene = scene ?? {
              id: drawingId,
              ...buildSceneContent([], {}, {}),
            };
            savedKeyRef.current = getSceneKey(
              loaded.elements,
              loaded.appState,
              loaded.files
            );
            setInitialScene(loaded);
            setStatus("saved");
          })
          .catch((error) => {
            console.error("Failed to load drawing", error);
            setStatus("error");
          });
        return () => {
          cancelled = true;
        };
      }, [drawingId, loadScene, setStatus]);

      const flush = useCallback(async () => {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        const pending = pendingRef.current;
        if (!pending) {
          return;
        }
        pendingRef.current = null;
        setStatus("saving");
        try {
          await saveScene(pending.scene);
          savedKeyRef.current = pending.key;
          if (!pendingRef.current) {
            setStatus("saved");
          }
        } catch (error) {
          console.error("Failed to save drawing", error);
          pendingRef.current ??= pending;
          setStatus("error");
        }
      }, [saveScene, setStatus]);

      const handleChange = useCallback(
        (
          elements: readonly OrderedExcalidrawElement[],
          appState: AppState,
          files: BinaryFiles
        ) => {
          const key = getSceneKey(elements, appState, files);
          if (key === savedKeyRef.current && !pendingRef.current) {
            return;
          }
          if (key === pendingRef.current?.key) {
            return;
          }
          pendingRef.current = {
            scene: { id: drawingId, ...buildSceneContent(elements, appState, files) },
            key,
          };
          setStatus("unsaved");
          if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
          }
          timerRef.current = window.setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
        },
        [drawingId, flush, setStatus]
      );

      const save = useCallback(() => {
        if (pendingRef.current) {
          void flush();
        } else {
          setStatus("saved");
        }
      }, [flush, setStatus]);

      useImperativeHandle(
        ref,
        () => ({
          save,
          openExport: () =>
            apiRef.current?.updateScene({
              appState: { openDialog: { name: "imageExport" } },
            }),
        }),
        [save]
      );

      // Ctrl/Cmd+S saves the board instead of the browser's "Save page" dialog.
      // Capture phase so Excalidraw's own shortcut handler never sees it.
      useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
          if (
            (event.ctrlKey || event.metaKey) &&
            !event.shiftKey &&
            event.code === "KeyS"
          ) {
            event.preventDefault();
            event.stopPropagation();
            save();
          }
        };
        window.addEventListener("keydown", onKeyDown, { capture: true });
        return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
      }, [save]);

      // Don't lose the debounced changes when switching boards or leaving the page.
      useEffect(() => {
        const onHide = () => {
          if (document.visibilityState === "hidden") {
            void flush();
          }
        };
        const onPageHide = () => void flush();
        document.addEventListener("visibilitychange", onHide);
        window.addEventListener("pagehide", onPageHide);
        return () => {
          document.removeEventListener("visibilitychange", onHide);
          window.removeEventListener("pagehide", onPageHide);
          void flush();
        };
      }, [flush]);

      // Settings → "Board text font" applies to new text immediately.
      const fontFamily = BOARD_FONT_FAMILY[settings.boardFont];
      useEffect(() => {
        apiRef.current?.updateScene({ appState: { currentItemFontFamily: fontFamily } });
      }, [fontFamily]);

      if (!initialScene) {
        return <div className={classes.loading} />;
      }

      return (
        <div className={classes.drawingEditor}>
          <Excalidraw
            excalidrawAPI={(api) => {
              apiRef.current = api;
            }}
            initialData={{
              elements: initialScene.elements,
              appState: { ...initialScene.appState, currentItemFontFamily: fontFamily },
              files: initialScene.files,
            }}
            name={name}
            theme={theme}
            langCode={LANGUAGES.find((l) => l.code === language)?.excalidrawCode}
            UIOptions={UI_OPTIONS}
            onChange={handleChange}
          >
            <MainMenu>
              <MainMenu.Item
                icon={<SaveIcon />}
                shortcut={`${MOD_KEY}+S`}
                onSelect={save}
              >
                {t("board.save")}
              </MainMenu.Item>
              <MainMenu.Item
                icon={<ImportIcon />}
                onSelect={() => void importFile(folderId)}
              >
                {t("board.importFile")}
              </MainMenu.Item>
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.SearchMenu />
              <MainMenu.DefaultItems.Help />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.Separator />
              <MainMenu.Item
                icon={<SidebarIcon />}
                shortcut={`${MOD_KEY}+\\`}
                onSelect={toggleSidebar}
              >
                {isSidebarOpen ? t("sidebar.hide") : t("sidebar.show")}
              </MainMenu.Item>
              <MainMenu.Group title={t("board.theme")}>
                {THEME_ITEMS.map(({ mode, icon: Icon }) => (
                  <MainMenu.Item
                    key={mode}
                    icon={<Icon />}
                    selected={settings.themeMode === mode}
                    onSelect={() => updateSettings({ themeMode: mode })}
                  >
                    {t(`settings.theme.${mode}`)}
                  </MainMenu.Item>
                ))}
              </MainMenu.Group>
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Hints.HelpHint />
              <WelcomeScreen.Center>
                <WelcomeScreen.Center.Heading>{name}</WelcomeScreen.Center.Heading>
              </WelcomeScreen.Center>
            </WelcomeScreen>
          </Excalidraw>
        </div>
      );
    }
  )
);
DrawingEditor.displayName = "DrawingEditor";

export { DrawingEditor };
