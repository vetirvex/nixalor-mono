import { NotesDb } from "../Storage/NotesDb";
import type { Attachment } from "../Storage/StorageTypes";
import { createId } from "./createId";

/** Notes reference embedded images as `![alt](attachment:<id>)`. */
const ATTACHMENT_PREFIX = "attachment:";

const ATTACHMENT_REF = /attachment:([\w-]+)/g;

const DATA_URL_IMAGE = /!\[([^\]]*)\]\((data:image\/[\w.+-]+;base64,[A-Za-z0-9+/=]+)\)/g;

// Object URLs live for the whole session; attachments are immutable.
const urlCache = new Map<string, Promise<string | null>>();

/** Object URL for an attachment (null when it no longer exists). */
const getAttachmentUrl = (id: string) => {
  let url = urlCache.get(id);
  if (!url) {
    url = NotesDb.getAttachment(id).then((item) =>
      item ? URL.createObjectURL(item.blob) : null
    );
    urlCache.set(id, url);
  }
  return url;
};

/** Stores images for a note and returns the Markdown that embeds them. */
const saveImages = async (noteId: string, files: File[]) => {
  const items: Attachment[] = files.map((file) => ({
    id: createId(),
    noteId,
    blob: file,
  }));
  await NotesDb.putAttachments(items);
  return items.map((item) => `![](${ATTACHMENT_PREFIX}${item.id})`);
};

const getReferencedIds = (content: string) =>
  new Set([...content.matchAll(ATTACHMENT_REF)].map((match) => match[1] ?? ""));

/** Drops images that the note no longer references. */
const removeUnusedAttachments = async (noteId: string, content: string) => {
  const used = getReferencedIds(content);
  const unused = (await NotesDb.getNoteAttachments(noteId))
    .filter((item) => !used.has(item.id))
    .map((item) => item.id);
  if (unused.length) {
    await NotesDb.deleteAttachments(unused);
  }
};

/** Copies a note's images to another note and rewrites the references. */
const copyAttachments = async (fromNoteId: string, toNoteId: string, content: string) => {
  const items = await NotesDb.getNoteAttachments(fromNoteId);
  const idMap = new Map(items.map((item) => [item.id, createId()]));
  await NotesDb.putAttachments(
    items.map((item) => ({ id: idMap.get(item.id)!, noteId: toNoteId, blob: item.blob }))
  );
  return content.replace(ATTACHMENT_REF, (match, id: string) =>
    idMap.has(id) ? `${ATTACHMENT_PREFIX}${idMap.get(id)}` : match
  );
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** For export: inlines images as data URLs so the .md file is self-contained. */
const inlineAttachments = async (noteId: string, content: string) => {
  const items = await NotesDb.getNoteAttachments(noteId);
  const dataUrls = new Map(
    await Promise.all(
      items.map(async (item) => [item.id, await blobToDataUrl(item.blob)] as const)
    )
  );
  return content.replace(
    ATTACHMENT_REF,
    (match, id: string) => dataUrls.get(id) ?? match
  );
};

/** For import: turns inline data-URL images back into attachments. */
const extractInlineImages = async (noteId: string, content: string) => {
  const items: Attachment[] = [];
  const rewritten = await replaceAsync(content, DATA_URL_IMAGE, async (alt, dataUrl) => {
    const blob = await (await fetch(dataUrl)).blob();
    const item = { id: createId(), noteId, blob };
    items.push(item);
    return `![${alt}](${ATTACHMENT_PREFIX}${item.id})`;
  });
  if (items.length) {
    await NotesDb.putAttachments(items);
  }
  return rewritten;
};

const replaceAsync = async (
  text: string,
  pattern: RegExp,
  replacer: (...groups: string[]) => Promise<string>
) => {
  const matches = [...text.matchAll(pattern)];
  const replacements = await Promise.all(
    matches.map((match) => replacer(...(match.slice(1) as string[])))
  );
  let result = "";
  let last = 0;
  matches.forEach((match, index) => {
    result += text.slice(last, match.index) + replacements[index];
    last = (match.index ?? 0) + match[0].length;
  });
  return result + text.slice(last);
};

/** Image files from a paste or drop, including screenshots from the clipboard. */
const getImageFiles = (data: DataTransfer | null) => {
  if (!data) {
    return [];
  }
  const files = [...data.files].filter((file) => file.type.startsWith("image/"));
  if (files.length) {
    return files;
  }
  return [...data.items]
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
};

export {
  ATTACHMENT_PREFIX,
  copyAttachments,
  extractInlineImages,
  getAttachmentUrl,
  getImageFiles,
  inlineAttachments,
  removeUnusedAttachments,
  saveImages,
};
