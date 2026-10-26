interface ColorMarkProps {
  color: string;
  /** "square" for folders, "dot" for boards (as in the design). */
  shape?: "square" | "dot";
  size?: number;
}

export type { ColorMarkProps };
