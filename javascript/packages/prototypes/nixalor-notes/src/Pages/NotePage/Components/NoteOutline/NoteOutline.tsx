import { memo } from "react";
import classes from "./NoteOutline.module.css";
import type { NoteOutlineProps } from "./NoteOutlineTypes";

const INDENT_PX = 14;

/** The note's table of contents, shown on the right like Obsidian's outline. */
const NoteOutline = memo<NoteOutlineProps>(
  ({ isOpen, headings, activeIndex, onSelect, title, emptyText }) => {
    const minLevel = Math.min(...headings.map((heading) => heading.level));

    return (
      <aside
        className={classes.noteOutline}
        aria-label={title}
        data-open={isOpen}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
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
    );
  }
);
NoteOutline.displayName = "NoteOutline";

export { NoteOutline };
