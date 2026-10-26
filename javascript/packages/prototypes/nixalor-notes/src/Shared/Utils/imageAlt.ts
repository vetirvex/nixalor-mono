type ImageAlign = "left" | "center" | "right";

interface ImageOptions {
  alt: string;
  /** Width in px; undefined = natural size (capped by the layout). */
  width?: number;
  /** Position within the image's own line; text never wraps around it. */
  align: ImageAlign;
}

const ALIGNS: readonly string[] = ["left", "center", "right"];

/**
 * Obsidian-style image options in the alt text: `caption|300|left`.
 * Order of the width and alignment parts doesn't matter.
 */
const parseImageAlt = (raw: string): ImageOptions => {
  const [alt = "", ...parts] = raw.split("|");
  const options: ImageOptions = { alt, align: "center" };
  for (const part of parts.map((p) => p.trim().toLowerCase())) {
    if (/^\d+$/.test(part)) {
      options.width = Number(part);
    } else if (ALIGNS.includes(part)) {
      options.align = part as ImageAlign;
    } else {
      // Not an option — it was part of the caption.
      options.alt += `|${part}`;
    }
  }
  return options;
};

/** Inverse of parseImageAlt; defaults (no width, centered) are left out. */
const formatImageAlt = ({ alt, width, align }: ImageOptions) =>
  [alt, ...(width ? [String(width)] : []), ...(align !== "center" ? [align] : [])].join(
    "|"
  );

export { formatImageAlt, parseImageAlt };
export type { ImageAlign, ImageOptions };
