import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { MOBILE_QUERY, useMediaQuery } from "../../Shared/Hooks/useMediaQuery";
import { LocalSettings } from "../../Shared/Storage/LocalSettings";
import type { MenuAnchor } from "../../Shared/Ui/Menu/MenuTypes";
import type { ItemRef } from "../NotesProvider/NotesTypes";
import { LayoutContext } from "./LayoutContext";
import type { CreateTab, DialogState, LayoutProviderProps } from "./LayoutTypes";

const LayoutProvider = memo<LayoutProviderProps>(({ children }) => {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(
    LocalSettings.getSidebarOpen
  );
  // On phones the sidebar is a drawer over the page: it starts closed and isn't remembered.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isSidebarOpen = isMobile ? isDrawerOpen : isDesktopSidebarOpen;
  const [dialog, setDialog] = useState<DialogState>(null);

  const setSidebarOpen = useCallback(
    (open: boolean) => {
      if (isMobile) {
        setIsDrawerOpen(open);
      } else {
        setIsDesktopSidebarOpen(open);
        LocalSettings.setSidebarOpen(open);
      }
    },
    [isMobile]
  );

  const toggleSidebar = useCallback(
    () => setSidebarOpen(!isSidebarOpen),
    [isSidebarOpen, setSidebarOpen]
  );

  // Leaving the phone layout must not leave an invisible drawer "open".
  useEffect(() => {
    if (!isMobile) {
      setIsDrawerOpen(false);
    }
  }, [isMobile]);

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
      isMobile,
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
      isMobile,
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
