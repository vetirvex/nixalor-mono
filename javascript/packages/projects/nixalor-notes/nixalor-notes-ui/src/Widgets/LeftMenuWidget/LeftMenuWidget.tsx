import { memo } from "react";
import classes from "./LeftMenuWidget.module.css";
import { LeftMenuWidgetProps } from "./LeftMenuWidgetTypes";

const LeftMenuWidget = memo<LeftMenuWidgetProps>(() => {
  return (
    <div className={classes.leftMenuContainer}>
      <span>asdas</span>
    </div>
  );
});
LeftMenuWidget.displayName = "LeftMenuWidget";

export { LeftMenuWidget };
