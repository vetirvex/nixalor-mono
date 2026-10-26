import type { ImageAlign } from "../../../../Shared/Utils/imageAlt";

interface MediaLabels {
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  resetSize: string;
  resize: string;
}

interface MediaLayout {
  /** Width in px; undefined = natural / full width. */
  width?: number;
  /** Height in px; undefined = follows the content. */
  height?: number;
  align: ImageAlign;
}

interface MediaControlsOptions {
  /** Block that carries data-align (and the resizing state). */
  wrapper: HTMLElement;
  /** Hover target that gets the toolbar and the resize handle. */
  frame: HTMLElement;
  /** Element whose size follows the handle while dragging. */
  sizedElement: HTMLElement;
  layout: MediaLayout;
  labels: MediaLabels;
  /** The handle can't shrink the element below this. */
  minSize: { width: number; height: number };
  /**
   * Images keep their proportions: only the width is set, the height follows.
   * Board previews (false) resize width and height independently.
   */
  keepAspectRatio: boolean;
  /** Writes the new layout back into the Markdown source. */
  onChange: (patch: Partial<MediaLayout>) => void;
}

// Lucide-style icons; widgets live outside React, so they're plain SVG strings.
const svg = (paths: string) =>
  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS: Record<ImageAlign | "reset", string> = {
  left: svg(
    '<rect x="3" y="5" width="8" height="8" rx="1"/><path d="M15 6h6M15 10h6M3 17h18M3 21h12"/>'
  ),
  center: svg(
    '<rect x="7" y="3" width="10" height="10" rx="1"/><path d="M3 17h18M6 21h12"/>'
  ),
  right: svg(
    '<rect x="13" y="5" width="8" height="8" rx="1"/><path d="M3 6h6M3 10h6M3 17h18M9 21h12"/>'
  ),
  reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
};
/**
 * Hover controls shared by images and embedded boards: left / center / right
 * alignment within the line, reset size, and a corner handle to resize —
 * proportionally for images, freely for boards (Shift keeps the proportions).
 */
const attachMediaControls = ({
  wrapper,
  frame,
  sizedElement,
  layout,
  labels,
  minSize,
  keepAspectRatio,
  onChange,
}: MediaControlsOptions) => {
  frame.classList.add("cm-media-frame");
  wrapper.dataset.align = layout.align;

  const toolbar = document.createElement("span");
  toolbar.className = "cm-media-toolbar";
  const buttons: [ImageAlign | "reset", string, () => void][] = [
    ["left", labels.alignLeft, () => onChange({ align: "left" })],
    ["center", labels.alignCenter, () => onChange({ align: "center" })],
    ["right", labels.alignRight, () => onChange({ align: "right" })],
    ["reset", labels.resetSize, () => onChange({ width: undefined, height: undefined })],
  ];
  for (const [key, label, action] of buttons) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.innerHTML = ICONS[key];
    if (key === layout.align) {
      button.setAttribute("aria-pressed", "true");
    }
    if (key === "reset" && !layout.width) {
      button.disabled = true;
    }
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      action();
    });
    toolbar.appendChild(button);
  }

  // Drag the corner to resize; the size is committed on release.
  const handle = document.createElement("span");
  handle.className = "cm-media-handle";
  handle.title = labels.resize;
  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const start = sizedElement.getBoundingClientRect();
    const maxWidth = wrapper.getBoundingClientRect().width;
    const ratio = start.width / Math.max(1, start.height);
    // Right-aligned media grow to the left, so the handle sits bottom-left.
    const direction = layout.align === "right" ? -1 : 1;
    let width = start.width;
    let height = start.height;
    wrapper.classList.add("cm-media-resizing");
    if (!keepAspectRatio) {
      // A fixed height lets the picture letterbox instead of overflowing.
      sizedElement.style.maxHeight = "none";
    }
    // Proportional resizing must respect the minimum height too.
    const minWidth = keepAspectRatio
      ? Math.max(minSize.width, Math.ceil(minSize.height * ratio))
      : minSize.width;
    const clampWidth = (value: number) =>
      Math.round(Math.min(maxWidth, Math.max(minWidth, value)));
    const onMove = (move: PointerEvent) => {
      width = clampWidth(start.width + (move.clientX - startX) * direction);
      if (keepAspectRatio) {
        // Only the width is set; the browser derives the height.
        sizedElement.style.width = `${width}px`;
        return;
      }
      if (move.shiftKey) {
        // Proportional: if the height hits its minimum, the width follows it.
        height = Math.round(width / ratio);
        if (height < minSize.height) {
          height = minSize.height;
          width = clampWidth(height * ratio);
        }
      } else {
        height = Math.round(
          Math.max(minSize.height, start.height + (move.clientY - startY))
        );
      }
      sizedElement.style.width = `${width}px`;
      sizedElement.style.height = `${height}px`;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      wrapper.classList.remove("cm-media-resizing");
      if (keepAspectRatio) {
        if (Math.abs(width - start.width) >= 1) {
          onChange({ width, height: undefined });
        }
      } else if (
        Math.abs(width - start.width) >= 1 ||
        Math.abs(height - start.height) >= 1
      ) {
        onChange({ width, height });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });

  frame.append(toolbar, handle);
};

/** Whether an event comes from the controls (so widgets can ignore it). */
const isMediaControlEvent = (event: Event) =>
  Boolean((event.target as HTMLElement).closest?.(".cm-media-toolbar, .cm-media-handle"));

export { attachMediaControls, isMediaControlEvent };
export type { MediaLabels, MediaLayout };
