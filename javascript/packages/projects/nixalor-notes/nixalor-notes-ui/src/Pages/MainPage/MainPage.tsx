import { memo } from "react";
import { CanvasWidget } from "../../Widgets/CanvasWidget/CanvasWidget";
import { LeftMenuWidget } from "../../Widgets/LeftMenuWidget/LeftMenuWidget";
import classes from "./MainPage.module.css";

const MainPage = memo(() => {
  return (
    <div className={classes.mainPageContainer}>
      <LeftMenuWidget />

      <CanvasWidget />
    </div>
  );
});
MainPage.displayName = "MainPage";

export { MainPage };
