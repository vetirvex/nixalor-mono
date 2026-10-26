import { syntaxTree } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import {
  ATTACHMENT_PREFIX,
  getAttachmentUrl,
} from "../../../../Shared/Utils/attachments";
import { formatImageAlt, MEDIA_MIN_SIZE } from "../../../../Shared/Utils/imageAlt";
import type { ImageOptions } from "../../../../Shared/Utils/imageAlt";
import { attachMediaControls, isMediaControlEvent } from "./mediaControls";
import type { MediaLabels } from "./mediaControls";

type ImageLabels = MediaLabels;

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

    attachMediaControls({
      wrapper,
      frame,
      sizedElement: img,
      layout: this.options,
      labels: this.labels,
      minSize: MEDIA_MIN_SIZE.image,
      keepAspectRatio: true,
      onChange: update,
    });

    return wrapper;
  }

  // The controls handle their own events; clicks on the picture place the cursor.
  override ignoreEvent(event: Event) {
    return isMediaControlEvent(event);
  }

  override get estimatedHeight() {
    return 240;
  }
}

export { ImageWidget };
export type { ImageLabels };
