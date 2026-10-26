import { syntaxTree } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import {
  ATTACHMENT_PREFIX,
  getAttachmentUrl,
} from "../../../../Shared/Utils/attachments";
import { formatImageAlt } from "../../../../Shared/Utils/imageAlt";
import type { ImageAlign, ImageOptions } from "../../../../Shared/Utils/imageAlt";

interface ImageLabels {
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  resetSize: string;
  resize: string;
}

const MIN_WIDTH = 48;

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

/** Finds the `![alt](src)` node rendered by a widget and returns its alt range. */
const findAltRange = (view: EditorView, dom: HTMLElement) => {
  const pos = view.posAtDOM(dom);
  const line = view.state.doc.lineAt(pos);
  let range: { from: number; to: number } | null = null;
  syntaxTree(view.state).iterate({
    from: line.from,
    to: line.to,
    enter: (node) => {
      if (node.name !== "Image" || node.from > pos || node.to < pos) {
        return;
      }
      const [open, close] = node.node.getChildren("LinkMark");
      if (open && close) {
        range = { from: open.to, to: close.from };
      }
      return false;
    },
  });
  return range as { from: number; to: number } | null;
};

/**
 * An embedded or external image with hover controls: alignment within its
 * own line (left / center / right) and a resize handle.
 * Changes are written back into the alt text, e.g. `![|320|left](…)`.
 */
class ImageWidget extends WidgetType {
  constructor(
    private readonly src: string,
    private readonly options: ImageOptions,
    private readonly labels: ImageLabels
  ) {
    super();
  }

  override eq(other: ImageWidget) {
    return (
      other.src === this.src &&
      other.options.alt === this.options.alt &&
      other.options.width === this.options.width &&
      other.options.align === this.options.align
    );
  }

  override toDOM(view: EditorView) {
    const wrapper = document.createElement("span");
    wrapper.className = "cm-image";
    wrapper.dataset.align = this.options.align;

    const frame = document.createElement("span");
    frame.className = "cm-image-frame";
    wrapper.appendChild(frame);

    const img = document.createElement("img");
    img.alt = this.options.alt;
    img.draggable = false;
    if (this.options.width) {
      img.style.width = `${this.options.width}px`;
    }
    if (this.src.startsWith(ATTACHMENT_PREFIX)) {
      void getAttachmentUrl(this.src.slice(ATTACHMENT_PREFIX.length)).then((url) => {
        if (url) {
          img.src = url;
        } else {
          wrapper.classList.add("cm-image-missing");
        }
      });
    } else {
      img.src = this.src;
    }
    frame.appendChild(img);

    const update = (patch: Partial<ImageOptions>) => {
      const range = findAltRange(view, wrapper);
      if (range) {
        view.dispatch({
          changes: { ...range, insert: formatImageAlt({ ...this.options, ...patch }) },
        });
      }
    };

    const toolbar = document.createElement("span");
    toolbar.className = "cm-image-toolbar";
    const buttons: [ImageAlign | "reset", string, () => void][] = [
      ["left", this.labels.alignLeft, () => update({ align: "left" })],
      ["center", this.labels.alignCenter, () => update({ align: "center" })],
      ["right", this.labels.alignRight, () => update({ align: "right" })],
      ["reset", this.labels.resetSize, () => update({ width: undefined })],
    ];
    for (const [key, label, action] of buttons) {
      const button = document.createElement("button");
      button.type = "button";
      button.title = label;
      button.setAttribute("aria-label", label);
      button.innerHTML = ICONS[key];
      if (key === this.options.align) {
        button.setAttribute("aria-pressed", "true");
      }
      if (key === "reset" && !this.options.width) {
        button.disabled = true;
      }
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        action();
      });
      toolbar.appendChild(button);
    }
    frame.appendChild(toolbar);

    // Drag the corner to resize; the width is committed on release.
    const handle = document.createElement("span");
    handle.className = "cm-image-handle";
    handle.title = this.labels.resize;
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = img.getBoundingClientRect().width;
      const maxWidth = view.contentDOM.getBoundingClientRect().width;
      // Right-aligned images grow to the left, so the handle sits bottom-left.
      const direction = this.options.align === "right" ? -1 : 1;
      let width = startWidth;
      wrapper.classList.add("cm-image-resizing");
      const onMove = (move: PointerEvent) => {
        width = Math.round(
          Math.min(
            maxWidth,
            Math.max(MIN_WIDTH, startWidth + (move.clientX - startX) * direction)
          )
        );
        img.style.width = `${width}px`;
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        wrapper.classList.remove("cm-image-resizing");
        if (Math.abs(width - startWidth) >= 1) {
          update({ width });
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
    frame.appendChild(handle);

    return wrapper;
  }

  // The controls handle their own events; clicks on the picture place the cursor.
  override ignoreEvent(event: Event) {
    const target = event.target as HTMLElement;
    return Boolean(target.closest?.(".cm-image-toolbar, .cm-image-handle"));
  }

  override get estimatedHeight() {
    return 240;
  }
}

export { ImageWidget };
export type { ImageLabels };
