import type { Drawing } from "../Storage/StorageTypes";

/** `[[Target]]` or `[[Target|Alias]]`, as in Obsidian. */
const WIKI_LINK = /\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;

const normalizeName = (name: string) =>
  name
    .trim()
    .replace(/\.(md|excalidraw)$/i, "")
    .toLocaleLowerCase();

/** Finds the file a wiki link points to by name (case-insensitive, extension optional). */
const resolveWikiLink = (target: string, files: readonly Drawing[]) => {
  const wanted = normalizeName(target);
  return files.find((file) => normalizeName(file.name) === wanted) ?? null;
};

export { normalizeName, resolveWikiLink, WIKI_LINK };
