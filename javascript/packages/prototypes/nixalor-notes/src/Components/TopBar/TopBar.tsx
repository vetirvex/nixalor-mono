import { memo } from "react";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { SidebarIcon } from "../../Shared/Icons/Icons";
import { IconButton } from "../../Shared/Ui/IconButton/IconButton";
import { MOD_KEY } from "../../Shared/Utils/platform";
import classes from "./TopBar.module.css";
import type { TopBarProps } from "./TopBarTypes";

const TopBar = memo<TopBarProps>(({ left, right }) => {
  const { t } = useI18n();
  const { isSidebarOpen, toggleSidebar } = useLayout();
  const toggleLabel = `${isSidebarOpen ? t("sidebar.hide") : t("sidebar.show")} (${MOD_KEY}+\\)`;

  return (
    <header className={classes.topBar}>
      <div className={classes.left}>
        <IconButton label={toggleLabel} variant="filled" onClick={toggleSidebar}>
          <SidebarIcon />
        </IconButton>
        {left}
      </div>
      {right && <div className={classes.right}>{right}</div>}
    </header>
  );
});
TopBar.displayName = "TopBar";

export { TopBar };
