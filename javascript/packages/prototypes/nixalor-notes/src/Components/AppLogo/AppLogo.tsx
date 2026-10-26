import { memo } from "react";
import { useSettings } from "../../Providers/SettingsProvider/SettingsContext";
import { getLogoUrl } from "../../Shared/Utils/favicon";
import type { AppLogoProps } from "./AppLogoTypes";

/** The app logo in the current accent color — the same image as the tab icon. */
const AppLogo = memo<AppLogoProps>(({ size, className }) => {
  const { settings } = useSettings();
  return (
    <img
      src={getLogoUrl(settings.accent)}
      alt=""
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
});
AppLogo.displayName = "AppLogo";

export { AppLogo };
