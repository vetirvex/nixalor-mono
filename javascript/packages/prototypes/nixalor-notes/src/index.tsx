import { createRoot } from "react-dom/client";
import "./Styles/index.css";
import { MainPage } from "./Pages/MainPage/MainPage";
import { ConfirmProvider } from "./Providers/ConfirmProvider/ConfirmProvider";
import { LayoutProvider } from "./Providers/LayoutProvider/LayoutProvider";
import { NotesProvider } from "./Providers/NotesProvider/NotesProvider";
import { SettingsProvider } from "./Providers/SettingsProvider/SettingsProvider";

const rootDom = document.getElementById("root")!;

createRoot(rootDom).render(
  <SettingsProvider>
    <LayoutProvider>
      <NotesProvider>
        <ConfirmProvider>
          <MainPage />
        </ConfirmProvider>
      </NotesProvider>
    </LayoutProvider>
  </SettingsProvider>
);
