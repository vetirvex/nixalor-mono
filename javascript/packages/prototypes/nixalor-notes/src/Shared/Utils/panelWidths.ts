import { LocalSettings } from "../Storage/LocalSettings";

type PanelId = "sidebar" | "outline";

interface PanelSize {
  /** CSS variable the panel's layout reads (defaults live in Tokens.css). */
  cssVar: string;
  defaultWidth: number;
  min: number;
  max: number;
}

// The inline script in index.html applies stored widths before first paint — keep in sync.
const PANEL_SIZES: Record<PanelId, PanelSize> = {
  sidebar: { cssVar: "--sidebar-width", defaultWidth: 275, min: 275, max: 480 },
  outline: { cssVar: "--outline-width", defaultWidth: 260, min: 180, max: 480 },
};

const clampPanelWidth = (panel: PanelId, width: number) => {
  const { min, max } = PANEL_SIZES[panel];
  return Math.round(Math.min(max, Math.max(min, width)));
};

const getPanelWidth = (panel: PanelId) =>
  clampPanelWidth(
    panel,
    LocalSettings.getPanelWidth(panel) ?? PANEL_SIZES[panel].defaultWidth
  );

/** Applies a width live; `persist` also remembers it (null restores the default). */
const setPanelWidth = (panel: PanelId, width: number | null, persist = true) => {
  const { cssVar } = PANEL_SIZES[panel];
  const style = document.documentElement.style;
  if (width === null) {
    style.removeProperty(cssVar);
  } else {
    style.setProperty(cssVar, `${clampPanelWidth(panel, width)}px`);
  }
  if (persist) {
    LocalSettings.setPanelWidth(
      panel,
      width === null ? null : clampPanelWidth(panel, width)
    );
  }
};

export { clampPanelWidth, getPanelWidth, PANEL_SIZES, setPanelWidth };
export type { PanelId };
