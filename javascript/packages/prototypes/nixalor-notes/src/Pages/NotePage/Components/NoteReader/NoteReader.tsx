import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { MouseEvent } from "react";
import { getAttachmentUrl } from "../../../../Shared/Utils/attachments";
import { renderMarkdown } from "../../../../Shared/Utils/markdown";
import classes from "./NoteReader.module.css";
import type { NoteReaderHandle, NoteReaderProps } from "./NoteReaderTypes";

const HEADING_SELECTOR =
  ":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6";
const ACTIVE_OFFSET_PX = 80;

const CHEVRON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

const headingLevel = (element: Element) => Number(element.tagName.slice(1));

/**
 * Hides everything under folded headings, up to the next heading of the same
 * or a higher level — the same sections the editor folds.
 */
const applyFolds = (
  article: HTMLElement,
  isFolded: (heading: HTMLElement) => boolean
) => {
  let foldedLevel: number | null = null;
  for (const child of Array.from(article.children) as HTMLElement[]) {
    const isHeading = /^H[1-6]$/.test(child.tagName);
    if (isHeading && foldedLevel !== null && headingLevel(child) <= foldedLevel) {
      foldedLevel = null;
    }
    child.hidden = foldedLevel !== null;
    if (isHeading && foldedLevel === null && isFolded(child)) {
      foldedLevel = headingLevel(child);
      child.dataset.folded = "true";
    } else if (isHeading) {
      child.dataset.folded = "false";
    }
  }
};

/** Reading view: rendered Markdown, clickable links/tasks and foldable sections. */
const NoteReader = memo(
  forwardRef<NoteReaderHandle, NoteReaderProps>(
    (
      {
        content,
        linkExists,
        onOpenLink,
        onToggleTask,
        emptyText,
        headings,
        foldedKeys,
        onToggleFold,
        foldLabel,
        onActiveHeadingChange,
      },
      ref
    ) => {
      const html = useMemo(
        () => renderMarkdown(content, linkExists),
        [content, linkExists]
      );
      const containerRef = useRef<HTMLDivElement>(null);
      const articleRef = useRef<HTMLElement>(null);
      const onActiveRef = useRef(onActiveHeadingChange);
      onActiveRef.current = onActiveHeadingChange;

      const getHeadingElements = () =>
        Array.from(
          articleRef.current?.querySelectorAll<HTMLElement>(HEADING_SELECTOR) ?? []
        );

      useEffect(() => {
        articleRef.current
          ?.querySelectorAll<HTMLImageElement>("img[data-attachment]")
          .forEach((img) => {
            void getAttachmentUrl(img.dataset.attachment ?? "").then((url) => {
              if (url) {
                img.src = url;
              }
            });
          });
      }, [html]);

      // Fold toggles on headings that have content under them, then hide folded parts.
      useEffect(() => {
        const article = articleRef.current;
        if (!article) {
          return;
        }
        getHeadingElements().forEach((element, index) => {
          element.dataset.index = String(index);
          const next = element.nextElementSibling;
          const hasSection =
            next &&
            !(
              /^H[1-6]$/.test(next.tagName) && headingLevel(next) <= headingLevel(element)
            );
          if (hasSection && !element.querySelector(":scope > .fold-toggle")) {
            const toggle = document.createElement("span");
            toggle.className = "fold-toggle";
            toggle.setAttribute("role", "button");
            toggle.setAttribute("aria-label", foldLabel);
            toggle.innerHTML = CHEVRON;
            element.prepend(toggle);
          }
        });
        applyFolds(article, (element) => {
          const key = headings[Number(element.dataset.index)]?.key;
          return key !== undefined && foldedKeys.has(key);
        });
      }, [html, headings, foldedKeys, foldLabel]);

      // Highlight in the outline the last heading that scrolled past the top.
      useEffect(() => {
        const container = containerRef.current;
        if (!container) {
          return;
        }
        let frame = 0;
        const onScroll = () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            const top = container.getBoundingClientRect().top + ACTIVE_OFFSET_PX;
            let active = 0;
            getHeadingElements().forEach((element, index) => {
              if (!element.hidden && element.getBoundingClientRect().top <= top) {
                active = index;
              }
            });
            onActiveRef.current(active);
          });
        };
        container.addEventListener("scroll", onScroll, { passive: true });
        return () => {
          cancelAnimationFrame(frame);
          container.removeEventListener("scroll", onScroll);
        };
      }, []);

      useImperativeHandle(
        ref,
        () => ({
          scrollToHeading: (index) => {
            getHeadingElements()[index]?.scrollIntoView({ block: "start" });
          },
        }),
        []
      );

      // The HTML comes from innerHTML, so React's onChange never fires for its
      // checkboxes — clicks still bubble, so links, tasks and folds are handled here.
      const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (
          target instanceof HTMLInputElement &&
          target.dataset.taskIndex !== undefined
        ) {
          onToggleTask(Number(target.dataset.taskIndex));
          return;
        }
        const toggle = target.closest<HTMLElement>(".fold-toggle");
        if (toggle) {
          const key = headings[Number(toggle.parentElement?.dataset.index)]?.key;
          if (key !== undefined) {
            onToggleFold(key);
          }
          return;
        }
        const link = target.closest<HTMLAnchorElement>("a.wikilink");
        if (link?.dataset.target) {
          event.preventDefault();
          onOpenLink(link.dataset.target);
        }
      };

      return (
        <div ref={containerRef} className={classes.noteReader}>
          {content.trim() ? (
            <article
              ref={articleRef}
              className={classes.content}
              onClick={handleClick}
              // Sanitized with DOMPurify in renderMarkdown.
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className={classes.empty}>{emptyText}</p>
          )}
        </div>
      );
    }
  )
);
NoteReader.displayName = "NoteReader";

export { NoteReader };
