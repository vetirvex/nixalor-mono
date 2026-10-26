import { createRoot } from "react-dom/client";
import "./Styles/index.css";
import { MainPage } from "./Pages/MainPage/MainPage";

const rooDom = document.getElementById("root")!;

createRoot(rooDom).render(<MainPage />);
