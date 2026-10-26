import { memo, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import classes from "./NameInput.module.css";
import type { NameInputProps } from "./NameInputTypes";

const NameInput = memo<NameInputProps>(({ initialValue, onSubmit, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // Enter/Escape unmount the input, which fires blur — make sure we finish once.
  const isDoneRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = (submit: boolean) => {
    if (isDoneRef.current) {
      return;
    }
    isDoneRef.current = true;
    const value = inputRef.current?.value.trim() ?? "";
    if (submit && value) {
      onSubmit(value);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      finish(true);
    } else if (event.key === "Escape") {
      finish(false);
    }
  };

  return (
    <input
      ref={inputRef}
      className={classes.nameInput}
      defaultValue={initialValue}
      aria-label="Name"
      onKeyDown={handleKeyDown}
      onBlur={() => finish(true)}
      onClick={(event) => event.stopPropagation()}
    />
  );
});
NameInput.displayName = "NameInput";

export { NameInput };
