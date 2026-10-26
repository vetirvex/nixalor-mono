import { memo } from "react";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { getFileKind } from "../../Shared/Storage/StorageTypes";
import { DialogHostWidget } from "../../Widgets/DialogHostWidget/DialogHostWidget";
import { LeftMenuWidget } from "../../Widgets/LeftMenuWidget/LeftMenuWidget";
import { DrawingPage } from "../DrawingPage/DrawingPage";
import { FavoritesPage } from "../FavoritesPage/FavoritesPage";
import { FolderPage } from "../FolderPage/FolderPage";
import { NotePage } from "../NotePage/NotePage";
import { StartPage } from "../StartPage/StartPage";
import classes from "./MainPage.module.css";

const MainPage = memo(() => {
  const { isLoaded, route, drawings } = useNotes();

  const renderRoute = () => {
    switch (route.type) {
      case "drawing": {
        const file = drawings.find((d) => d.id === route.id);
        return file && getFileKind(file) === "note" ? (
          <NotePage key={route.id} noteId={route.id} />
        ) : (
          <DrawingPage key={route.id} drawingId={route.id} />
        );
      }
      case "folder":
        return <FolderPage key={route.id} folderId={route.id} />;
      case "favorites":
        return <FavoritesPage />;
      default:
        return <StartPage />;
    }
  };

  return (
    <div className={classes.mainPageContainer}>
      <LeftMenuWidget />

      <main className={classes.content}>{isLoaded && renderRoute()}</main>

      <DialogHostWidget />
    </div>
  );
});
MainPage.displayName = "MainPage";

export { MainPage };
