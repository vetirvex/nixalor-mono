import { createContext, useContext } from "react";
import type { NotesContextValue } from "./NotesTypes";

const NotesContext = createContext<NotesContextValue | null>(null);

const useNotes = () => {
  const value = useContext(NotesContext);
  if (!value) {
    throw new Error("useNotes must be used inside NotesProvider");
  }
  return value;
};

export { NotesContext, useNotes };
