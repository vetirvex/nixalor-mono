type ImageAlign = "left" | "center" | "right";

interface ImageOptions {
  alt: string;
  /** Width in px; undefined = natural size (capped by the layout). */
  width?: number;
  /** Height in px — board previews only; images keep their proportions. */
  height?: number;
  /** Position within the image's own line; text never wraps around it. */
  align: ImageAlign;
}

const ALIGNS: readonly string[] = ["left", "center", "right"];

type MediaKind = "image" | "board";

/**
 * Smallest size an image / embedded board preview can be resized to. A board
 * needs room for its caption plus a readable drawing.
 */
const MEDIA_MIN_SIZE: Record<MediaKind, { width: number; height: number }> = {
  image: { width: 80, height: 60 },
  board: { width: 240, height: 180 },
};

/**
 * Normalizes sizes for display: raises values below the minimum (e.g. `|10x10`
 * typed by hand) and drops the height of images, which always keep their proportions.
 */
const clampMediaSize = <T extends { width?: number; height?: number }>(
  kind: MediaKind,
  options: T
): T => {
  const min = MEDIA_MIN_SIZE[kind];
  const height =
    kind === "image" || options.height === undefined
      ? undefined
      : Math.max(min.height, options.height);
  return {
    ...options,
    width: options.width === undefined ? undefined : Math.max(min.width, options.width),
    height,
  };
};

/**
 * Obsidian-style options in the alt text: `caption|300|left` or
 * `caption|300x200|right`. The order of the size and alignment parts doesn't matter.
 */
const parseImageAlt = (raw: string): ImageOptions => {
  const [alt = "", ...parts] = raw.split("|");
  const options: ImageOptions = { alt, align: "center" };
  for (const part of parts.map((p) => p.trim().toLowerCase())) {
    const size = /^(\d+)(?:x(\d+))?$/.exec(part);
    if (size) {
      options.width = Number(size[1]);
      options.height = size[2] ? Number(size[2]) : undefined;
    } else if (ALIGNS.includes(part)) {
      options.align = part as ImageAlign;
    } else {
      // Not an option — it was part of the caption.
      options.alt += `|${part}`;
    }
  }
  return options;
};

/** Inverse of parseImageAlt; defaults (natural size, centered) are left out. */
const formatImageAlt = ({ alt, width, height, align }: ImageOptions) => {
  const size = width ? [height ? `${width}x${height}` : String(width)] : [];
  return [alt, ...size, ...(align !== "center" ? [align] : [])].join("|");
};

export { clampMediaSize, formatImageAlt, MEDIA_MIN_SIZE, parseImageAlt };
export type { ImageAlign, ImageOptions, MediaKind };
