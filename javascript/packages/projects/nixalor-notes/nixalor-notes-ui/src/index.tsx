import {createRoot} from "react-dom/client";
import {App} from "./App";
import "./Styles/index.css";

const rooDom = document.getElementById('root')!;

createRoot(rooDom).render(<App />);