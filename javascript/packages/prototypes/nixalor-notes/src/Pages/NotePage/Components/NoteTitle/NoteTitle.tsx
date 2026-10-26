import { memo, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import classes from "./NoteTitle.module.css";
import type { NoteTitleProps } from "./NoteTitleTypes";

/** Editable file name shown as the note's heading (renames on Enter / blur). */
const NoteTitle = memo<NoteTitleProps>(({ name, placeholder, onRename, onExit }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(name);

  // A textarea wraps long names; grow it to fit instead of scrolling.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.style.height = "auto";
      input.style.height = `${input.scrollHeight}px`;
    }
  }, [value]);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(name);
    } else if (trimmed !== name) {
      onRename(trimmed);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Keep editor and app shortcuts (⌘E, ⌘S…) from acting on the title.
    event.stopPropagation();
    const input = event.currentTarget;
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (onExit) {
        commit();
        onExit();
      } else {
        input.blur();
      }
    } else if (event.key === "Escape") {
      setValue(name);
      // Blur commits the reverted value, which is a no-op.
      requestAnimationFrame(() => input.blur());
    } else if (
      event.key === "ArrowDown" &&
      onExit &&
      input.selectionStart === input.value.length
    ) {
      event.preventDefault();
      commit();
      onExit();
    }
  };

  return (
    <textarea
      ref={inputRef}
      className={classes.noteTitle}
      value={value}
      rows={1}
      placeholder={placeholder}
      aria-label={placeholder}
      spellCheck={false}
      // A file name is one line, even when pasted text has line breaks.
      onChange={(event) => setValue(event.target.value.replace(/\s*\n\s*/g, " "))}
      onKeyDown={handleKeyDown}
      onBlur={commit}
    />
  );
});
NoteTitle.displayName = "NoteTitle";

export { NoteTitle };
