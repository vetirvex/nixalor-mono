interface Heading {
  level: number;
  /** Plain text, without inline Markdown. */
  text: string;
  /** 1-based line number in the note source. */
  line: number;
  /**
   * Identifies a heading across edits and between the editor and the reading
   * view, e.g. "2:Section" — used to remember folded sections.
   */
  key: string;
}

const ATX_HEADING = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/;
const FENCE = /^\s*(```|~~~)/;

const toPlainText = (text: string) =>
  text
    .replace(/!?\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/!?\[\[([^\]]+)\]\]/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`=]/g, "")
    .trim();

/** Key of a heading source line ("## Title"), or null if the line isn't one. */
const getHeadingKey = (lineText: string) => {
  const match = ATX_HEADING.exec(lineText);
  return match ? `${match[1]?.length}:${toPlainText(match[2] ?? "")}` : null;
};

/** ATX headings of a note in document order, skipping fenced code blocks. */
const extractHeadings = (content: string): Heading[] => {
  const headings: Heading[] = [];
  let inFence = false;
  content.split("\n").forEach((lineText, index) => {
    if (FENCE.test(lineText)) {
      inFence = !inFence;
      return;
    }
    const match = !inFence && ATX_HEADING.exec(lineText);
    if (match) {
      const level = match[1]?.length ?? 1;
      const text = toPlainText(match[2] ?? "");
      headings.push({ level, text, line: index + 1, key: `${level}:${text}` });
    }
  });
  return headings;
};

export { extractHeadings, getHeadingKey };
export type { Heading };
