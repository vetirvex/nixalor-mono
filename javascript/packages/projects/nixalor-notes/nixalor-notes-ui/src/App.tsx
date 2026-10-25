import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const App = () => {
    return (
        <div style={{ height: "100vh" }}>
            <Excalidraw />
        </div>
    );
}
App.displayName = "App";

export { App };
