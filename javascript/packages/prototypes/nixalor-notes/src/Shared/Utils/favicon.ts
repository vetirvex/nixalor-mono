import type { AccentColor } from "../../Providers/SettingsProvider/SettingsTypes";
import template from "../Assets/favicon-template.svg?raw";

type Rgb = [number, number, number];

/**
 * Per-accent tones of the logo's gradients, from the brightest highlight to the
 * deepest shade (two hues per accent keep the artwork's depth, like the
 * yellow → orange of the default).
 */
const PALETTES: Record<AccentColor, { highlight: string; main: string; deep: string }> = {
  yellow: { highlight: "#facc15", main: "#f59e0b", deep: "#ea6a0c" },
  lime: { highlight: "#bef264", main: "#a3e635", deep: "#4d9b0d" },
  teal: { highlight: "#99f6e4", main: "#5eead4", deep: "#0d9488" },
  pink: { highlight: "#fecdd3", main: "#fda4af", deep: "#e11d48" },
  blue: { highlight: "#93c5fd", main: "#3b82f6", deep: "#1d4ed8" },
  purple: { highlight: "#c4b5fd", main: "#8b5cf6", deep: "#6d28d9" },
};

/** Brightest red of the template artwork — maps to the palette highlight. */
const TEMPLATE_MAX_RED = 0xdb;

const toRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const toHex = (rgb: Rgb) =>
  `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;

const scale = ([r, g, b]: Rgb, factor: number): Rgb => [
  r * factor,
  g * factor,
  b * factor,
];

const buildRamp = (accent: AccentColor): [number, Rgb][] => {
  const { highlight, main, deep } = PALETTES[accent];
  const deepRgb = toRgb(deep);
  return [
    [0, scale(deepRgb, 0.18)],
    [0.3, scale(deepRgb, 0.5)],
    [0.6, deepRgb],
    [0.82, toRgb(main)],
    [1, toRgb(highlight)],
  ];
};

const sampleRamp = (ramp: [number, Rgb][], t: number): Rgb => {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 1; i < ramp.length; i++) {
    const [t0, c0] = ramp[i - 1]!;
    const [t1, c1] = ramp[i]!;
    if (clamped <= t1) {
      const k = (clamped - t0) / (t1 - t0);
      return [0, 1, 2].map((ch) => c0[ch]! + (c1[ch]! - c0[ch]!) * k) as Rgb;
    }
  }
  return ramp[ramp.length - 1]![1];
};

/**
 * The logo recolored for an accent: every red tone of the template is replaced
 * by the accent tone of the same brightness, so gradients and shading survive.
 */
const buildFaviconSvg = (accent: AccentColor) => {
  const ramp = buildRamp(accent);
  return template.replace(
    /(fill|stop-color)="#([0-9a-fA-F]{6})"/g,
    (match, attr: string, hex: string) => {
      const [r, g, b] = toRgb(`#${hex}`);
      // Only the red artwork; the neutral background stays as is.
      if (!(r > g * 2 && r > b * 2 && r >= 4)) {
        return match;
      }
      return `${attr}="${toHex(sampleRamp(ramp, r / TEMPLATE_MAX_RED))}"`;
    }
  );
};

// One object URL per accent, reused by the tab icon and the in-app logo.
const logoUrls = new Map<AccentColor, string>();

/** Object URL of the logo recolored for `accent` (cached; at most one per accent). */
const getLogoUrl = (accent: AccentColor) => {
  let url = logoUrls.get(accent);
  if (!url) {
    url = URL.createObjectURL(
      new Blob([buildFaviconSvg(accent)], { type: "image/svg+xml" })
    );
    logoUrls.set(accent, url);
  }
  return url;
};

/** Points the page's favicon at the logo recolored for `accent`. */
const applyFavicon = (accent: AccentColor) => {
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = getLogoUrl(accent);
};

export { applyFavicon, buildFaviconSvg, getLogoUrl };
