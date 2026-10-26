import type { EditorView } from "@codemirror/view";
import { WidgetType } from "@codemirror/view";
import { getBoardPreviewUrl } from "../../../../Shared/Utils/boardPreview";
import { formatImageAlt, MEDIA_MIN_SIZE } from "../../../../Shared/Utils/imageAlt";
import { attachMediaControls, isMediaControlEvent } from "./mediaControls";
import type { MediaLabels, MediaLayout } from "./mediaControls";

const EMBED = /!\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;

const BOARD_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 17c2.5-1 3.5-5 6-5s2 3 4.5 3S18 9 20 7"/></svg>';

interface EmbeddedBoard {
  id: string;
  name: string;
  updatedAt: number;
}

/** Rewrites the `![[Board|width|align]]` around `pos` with a new layout. */
const updateEmbedSource = (view: EditorView, pos: number, layout: MediaLayout) => {
  const line = view.state.doc.lineAt(pos);
  for (const match of line.text.matchAll(EMBED)) {
    const from = line.from + (match.index ?? 0);
    const to = from + match[0].length;
    if (pos >= from && pos <= to) {
      const options = formatImageAlt({ alt: "", ...layout });
      view.dispatch({ changes: { from, to, insert: `![[${match[1]}${options}]]` } });
      return;
    }
  }
};

/**
 * Preview of an Excalidraw board embedded with `![[Board name]]`. Like images,
 * it can be resized and aligned: `![[Board|480x300|right]]`.
 */
class BoardEmbedWidget extends WidgetType {
  constructor(
    private readonly board: EmbeddedBoard,
    private readonly layout: MediaLayout,
    private readonly labels: MediaLabels,
    private readonly emptyText: string,
    private readonly onOpen: (name: string) => void
  ) {
    super();
  }

  override eq(other: BoardEmbedWidget) {
    return (
      other.board.id === this.board.id &&
      other.board.updatedAt === this.board.updatedAt &&
      other.board.name === this.board.name &&
      other.layout.width === this.layout.width &&
      other.layout.height === this.layout.height &&
      other.layout.align === this.layout.align &&
      other.emptyText === this.emptyText
    );
  }

  override toDOM(view: EditorView) {
    const wrapper = document.createElement("span");
    wrapper.className = "cm-board-embed";

    const frame = document.createElement("span");
    frame.className = "cm-board-embed-frame";
    frame.setAttribute("role", "link");
    frame.title = this.board.name;
    if (this.layout.width) {
      frame.style.width = `${this.layout.width}px`;
    }
    if (this.layout.height) {
      frame.style.height = `${this.layout.height}px`;
    }
    frame.addEventListener("mousedown", (event) => {
      if (isMediaControlEvent(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.onOpen(this.board.name);
    });

    const preview = document.createElement("span");
    preview.className = "cm-board-embed-preview";
    void getBoardPreviewUrl(this.board.id, this.board.updatedAt).then((url) => {
      if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = this.board.name;
        img.draggable = false;
        preview.appendChild(img);
      } else {
        preview.textContent = this.emptyText;
        preview.classList.add("cm-board-embed-empty");
      }
    });

    const caption = document.createElement("span");
    caption.className = "cm-board-embed-caption";
    caption.innerHTML = BOARD_ICON;
    caption.append(this.board.name);

    frame.append(preview, caption);
    wrapper.appendChild(frame);

    attachMediaControls({
      wrapper,
      frame,
      sizedElement: frame,
      layout: this.layout,
      labels: this.labels,
      minSize: MEDIA_MIN_SIZE.board,
      keepAspectRatio: false,
      onChange: (patch) =>
        updateEmbedSource(view, view.posAtDOM(wrapper), { ...this.layout, ...patch }),
    });
    return wrapper;
  }

  override ignoreEvent() {
    return true;
  }

  override get estimatedHeight() {
    return 300;
  }
}

export { BoardEmbedWidget };
export type { EmbeddedBoard };
