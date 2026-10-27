import { type CSSProperties, memo, useEffect, useState } from "react";
import classes from "./Icon.module.css";
import { svgLoader } from "../../Utils/SvgLoader";

/**
 * Icon sizes available in the core components:
 *
 * `3xs` (10px)  |  `xxs` (12px)  |  `xs` (16px)  |  `s` **[20px / Default]**  |
 * `m` (24px)  |  `l` (32px)  |  `xl` (40px)  |  `xxl` (48px)  |  `3xl` (64px)
 */
type IconSize = "3xs" | "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl" | "3xl";

interface IconProps {
  svgPath: string;
  size?: IconSize;
  className?: string;
}

const ICON_SIZES_MAP: Record<IconSize, string> = {
  "3xs": "10px",
  xxs: "12px",
  xs: "16px",
  s: "20px",
  m: "24px",
  l: "32px",
  xl: "40px",
  xxl: "48px",
  "3xl": "64px",
};

const Icon = memo<IconProps>(({ svgPath, size = "m", className }) => {
  const sizeValue = ICON_SIZES_MAP[size];
  const [html, setHtml] = useState(() => svgLoader.getSvg(svgPath) ?? "");

  useEffect(
    () =>
      svgLoader.subscribe(svgPath, (svgData) =>
        setHtml((prev) => (prev !== svgData ? svgData : prev))
      ),
    [svgPath]
  );

  const styles: CSSProperties = {
    width: sizeValue,
    height: sizeValue,
    minWidth: sizeValue,
  };

  const htmlData = { __html: html };

  return (
    <span
      style={styles}
      className={classes.icon}
      dangerouslySetInnerHTML={htmlData}
    ></span>
  );
});
Icon.displayName = "Icon";

export { type IconSize, type IconProps, Icon };
