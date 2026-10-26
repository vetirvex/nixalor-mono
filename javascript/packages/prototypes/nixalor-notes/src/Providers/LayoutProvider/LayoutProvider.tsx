import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { LocalSettings } from "../../Shared/Storage/LocalSettings";
import type { MenuAnchor } from "../../Shared/Ui/Menu/MenuTypes";
import type { ItemRef } from "../NotesProvider/NotesTypes";
import { LayoutContext } from "./LayoutContext";
import type { CreateTab, DialogState, LayoutProviderProps } from "./LayoutTypes";

const LayoutProvider = memo<LayoutProviderProps>(({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(LocalSettings.getSidebarOpen);
  const [dialog, setDialog] = useState<DialogState>(null);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpen(open);
    LocalSettings.setSidebarOpen(open);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      LocalSettings.setSidebarOpen(!prev);
      return !prev;
    });
  }, []);

  const openPalette = useCallback(() => setDialog({ type: "palette" }), []);
  const openCreate = useCallback(
    (tab: CreateTab, folderId: string | null) =>
      setDialog({ type: "create", tab, folderId }),
    []
  );
  const openSettings = useCallback(() => setDialog({ type: "settings" }), []);
  const openMove = useCallback(
    (items: ItemRef[]) => setDialog({ type: "move", items }),
    []
  );
  const openIconPicker = useCallback(
    (item: ItemRef, anchor: MenuAnchor) => setDialog({ type: "icon", item, anchor }),
    []
  );
  const closeDialog = useCallback(() => setDialog(null), []);

  // Global shortcuts. Capture phase so Excalidraw doesn't swallow them
  // (it uses Ctrl/Cmd+K for links).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }
      if (event.code === "KeyK" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        setDialog((prev) => (prev?.type === "palette" ? null : { type: "palette" }));
      } else if (event.code === "Backslash") {
        event.preventDefault();
        event.stopPropagation();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [toggleSidebar]);

  const value = useMemo(
    () => ({
      isSidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      dialog,
      openPalette,
      openCreate,
      openSettings,
      openMove,
      openIconPicker,
      closeDialog,
    }),
    [
      isSidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      dialog,
      openPalette,
      openCreate,
      openSettings,
      openMove,
      openIconPicker,
      closeDialog,
    ]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
});
LayoutProvider.displayName = "LayoutProvider";

export { LayoutProvider };
