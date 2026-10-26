import { memo } from "react";
import { TopBar } from "../../Components/TopBar/TopBar";
import { useLayout } from "../../Providers/LayoutProvider/LayoutContext";
import { useI18n } from "../../Shared/I18n/I18nContext";
import { PlusIcon, SearchIcon } from "../../Shared/Icons/Icons";
import { Button } from "../../Shared/Ui/Button/Button";
import { Kbd } from "../../Shared/Ui/Kbd/Kbd";
import { MOD_KEY } from "../../Shared/Utils/platform";
import classes from "./StartPage.module.css";
import type { StartPageProps } from "./StartPageTypes";

/** Shown when no board or folder is open. */
const StartPage = memo<StartPageProps>(() => {
  const { t } = useI18n();
  const { openCreate, openPalette } = useLayout();

  return (
    <div className={classes.startPage}>
      <TopBar />
      <div className={classes.body}>
        <h1 className={classes.title}>{t("start.title")}</h1>
        <p className={classes.text}>{t("start.text")}</p>
        <div className={classes.actions}>
          <Button
            variant="primary"
            icon={<PlusIcon size={15} strokeWidth={2.5} />}
            onClick={() => openCreate("board", null)}
          >
            {t("create.submitBoard")}
          </Button>
          <Button icon={<SearchIcon size={15} />} onClick={openPalette}>
            {t("nav.search")}
            <Kbd>{MOD_KEY}K</Kbd>
          </Button>
        </div>
      </div>
    </div>
  );
});
StartPage.displayName = "StartPage";

export { StartPage };
