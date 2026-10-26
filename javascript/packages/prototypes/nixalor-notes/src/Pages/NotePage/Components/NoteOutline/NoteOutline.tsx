import { memo, useRef } from "react";
import { MOBILE_QUERY, useMediaQuery } from "../../../../Shared/Hooks/useMediaQuery";
import { useSwipeDismiss } from "../../../../Shared/Hooks/useSwipeDismiss";
import { ResizeHandle } from "../../../../Shared/Ui/ResizeHandle/ResizeHandle";
import classes from "./NoteOutline.module.css";
import type { NoteOutlineProps } from "./NoteOutlineTypes";

const INDENT_PX = 14;

/** The note's table of contents, shown on the right like Obsidian's outline. */
const NoteOutline = memo<NoteOutlineProps>(
  ({
    isOpen,
    headings,
    activeIndex,
    onSelect,
    title,
    emptyText,
    resizeLabel,
    isOverlay,
    onClose,
  }) => {
    const minLevel = Math.min(...headings.map((heading) => heading.level));
    const asideRef = useRef<HTMLElement>(null);
    const isMobile = useMediaQuery(MOBILE_QUERY);
    useSwipeDismiss({
      ref: asideRef,
      direction: "down",
      enabled: isMobile && isOpen,
      onDismiss: onClose,
    });

    return (
      <>
        {isOverlay && (
          <div className={classes.backdrop} data-open={isOpen} onClick={onClose} />
        )}
        <aside
          ref={asideRef}
          className={classes.noteOutline}
          data-overlay={isOverlay}
          aria-label={title}
          data-open={isOpen}
          aria-hidden={!isOpen}
          inert={!isOpen}
        >
          {!isOverlay && <ResizeHandle panel="outline" edge="left" label={resizeLabel} />}
          <div className={classes.panel}>
            <h2 className={classes.title}>{title}</h2>
            {headings.length === 0 ? (
              <p className={classes.empty}>{emptyText}</p>
            ) : (
              <nav className={classes.list}>
                {headings.map((heading, index) => (
                  <button
                    key={`${heading.line}:${heading.key}`}
                    type="button"
                    className={classes.item}
                    data-level={heading.level}
                    aria-current={index === activeIndex ? "location" : undefined}
                    style={{ paddingLeft: 10 + (heading.level - minLevel) * INDENT_PX }}
                    title={heading.text}
                    onClick={() => onSelect(index)}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </aside>
      </>
    );
  }
);
NoteOutline.displayName = "NoteOutline";

export { NoteOutline };
