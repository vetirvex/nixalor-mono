import { loadFromBlob, serializeAsJSON } from "@excalidraw/excalidraw";
import { strFromU8, strToU8, unzip, zip } from "fflate";
import type { Unzipped, Zippable } from "fflate";
import type {
  Attachment,
  Drawing,
  DrawingScene,
  Folder,
  NoteContent,
  NotesSnapshot,
  SavedAppState,
} from "../Storage/StorageTypes";
import { getFileKind } from "../Storage/StorageTypes";
import { getFolderPath } from "./folderTree";
import { buildSceneContent } from "./scene";

/**
 * A backup is a zip with the tree laid out as real files (`Folder/Note.md`,
 * `Folder/Board.excalidraw`, `attachments/<id>`) so it is readable by hand,
 * plus `manifest.json` with the records needed to restore it exactly.
 */
const MANIFEST = "manifest.json";
const FORMAT = "nixalor-notes-backup";
const VERSION = 1;

interface BackupFile extends Drawing {
  /** Path of the .md / .excalidraw file inside the zip. */
  path: string;
  /** Board view (scroll, zoom…) — the .excalidraw format drops part of it. */
  appState?: SavedAppState;
}

interface BackupAttachment {
  id: string;
  noteId: string;
  type: string;
  path: string;
}

interface BackupManifest {
  format: typeof FORMAT;
  version: number;
  exportedAt: number;
  folders: Folder[];
  files: BackupFile[];
  attachments: BackupAttachment[];
}

// fflate's buffers are always backed by a plain ArrayBuffer, which Blob needs.
const zipAsync = (files: Zippable) =>
  new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) =>
    zip(files, (error, data) =>
      error ? reject(error) : resolve(data as Uint8Array<ArrayBuffer>)
    )
  );

const unzipAsync = (data: Uint8Array) =>
  new Promise<Unzipped>((resolve, reject) =>
    unzip(data, (error, files) => (error ? reject(error) : resolve(files)))
  );

/** A name that is safe as a path segment on every OS. */
const toSegment = (name: string) =>
  // eslint-disable-next-line no-control-regex
  name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/, "")
    .trim() || "Untitled";

/** Adds " (2)", " (3)"… until the path is free (case-insensitive, like macOS). */
const reservePath = (taken: Set<string>, base: string, extension: string) => {
  let path = `${base}${extension}`;
  for (let index = 2; taken.has(path.toLowerCase()); index++) {
    path = `${base} (${index})${extension}`;
  }
  taken.add(path.toLowerCase());
  return path;
};

const getExtension = (type: string) => {
  const subtype = type.split("/")[1]?.split("+")[0];
  return subtype ? `.${subtype.replace("jpeg", "jpg")}` : "";
};

const createBackup = async (snapshot: NotesSnapshot) => {
  const scenes = new Map(snapshot.scenes.map((scene) => [scene.id, scene]));
  const notes = new Map(snapshot.notes.map((note) => [note.id, note]));
  const taken = new Set([MANIFEST.toLowerCase()]);
  const entries: Zippable = {};
  const files: BackupFile[] = [];

  for (const drawing of snapshot.drawings) {
    const folderPath = getFolderPath(drawing.folderId, snapshot.folders)
      .map((folder) => `${toSegment(folder.name)}/`)
      .join("");
    const base = `${folderPath}${toSegment(drawing.name)}`;
    if (getFileKind(drawing) === "note") {
      const path = reservePath(taken, base, ".md");
      entries[path] = strToU8(notes.get(drawing.id)?.content ?? "");
      files.push({ ...drawing, path });
      continue;
    }
    const scene = scenes.get(drawing.id);
    const path = reservePath(taken, base, ".excalidraw");
    entries[path] = strToU8(
      scene ? serializeAsJSON(scene.elements, scene.appState, scene.files, "local") : "{}"
    );
    files.push({ ...drawing, path, appState: scene?.appState });
  }

  const attachments = await Promise.all(
    snapshot.attachments.map(async (item): Promise<BackupAttachment> => {
      const path = `attachments/${item.id}${getExtension(item.blob.type)}`;
      // Images are already compressed — store them as is.
      entries[path] = [new Uint8Array(await item.blob.arrayBuffer()), { level: 0 }];
      return { id: item.id, noteId: item.noteId, type: item.blob.type, path };
    })
  );

  const manifest: BackupManifest = {
    format: FORMAT,
    version: VERSION,
    exportedAt: Date.now(),
    folders: snapshot.folders,
    files,
    attachments,
  };
  entries[MANIFEST] = strToU8(JSON.stringify(manifest, null, 2));
  return new Blob([await zipAsync(entries)], { type: "application/zip" });
};

class InvalidBackupError extends Error {}

const readManifest = (entries: Unzipped) => {
  const raw = entries[MANIFEST];
  if (!raw) {
    throw new InvalidBackupError("manifest.json is missing");
  }
  let manifest: Partial<BackupManifest>;
  try {
    manifest = JSON.parse(strFromU8(raw)) as Partial<BackupManifest>;
  } catch {
    throw new InvalidBackupError("manifest.json is not valid JSON");
  }
  if (manifest.format !== FORMAT || !manifest.version || manifest.version > VERSION) {
    throw new InvalidBackupError("Unsupported backup format");
  }
  return manifest as BackupManifest;
};

/** Reads a backup made by `createBackup`; throws InvalidBackupError for other files. */
const readBackup = async (
  file: Blob
): Promise<{ snapshot: NotesSnapshot; exportedAt: number }> => {
  const entries = await unzipAsync(new Uint8Array(await file.arrayBuffer())).catch(
    (error: unknown) => {
      throw new InvalidBackupError(String(error));
    }
  );
  const manifest = readManifest(entries);
  const readText = (path: string) => {
    const data = entries[path];
    if (!data) {
      throw new InvalidBackupError(`${path} is missing`);
    }
    return strFromU8(data);
  };

  const drawings: Drawing[] = [];
  const scenes: DrawingScene[] = [];
  const notes: NoteContent[] = [];
  for (const { path, appState, ...drawing } of manifest.files) {
    drawings.push(drawing);
    if (getFileKind(drawing) === "note") {
      notes.push({ id: drawing.id, content: readText(path) });
      continue;
    }
    const data = await loadFromBlob(
      new Blob([readText(path)], { type: "application/json" }),
      null,
      null
    );
    const content = buildSceneContent(data.elements, data.appState, data.files);
    scenes.push({
      id: drawing.id,
      ...content,
      appState: { ...content.appState, ...appState },
    });
  }

  const attachments: Attachment[] = manifest.attachments.flatMap((item) => {
    const data = entries[item.path];
    // A lost image only breaks its own embed — don't fail the whole restore.
    return data
      ? [
          {
            id: item.id,
            noteId: item.noteId,
            blob: new Blob([data as Uint8Array<ArrayBuffer>], { type: item.type }),
          },
        ]
      : [];
  });

  return {
    snapshot: { folders: manifest.folders, drawings, scenes, notes, attachments },
    exportedAt: manifest.exportedAt,
  };
};

const getBackupFileName = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `nixalor-notes-${day}-${pad(date.getHours())}${pad(date.getMinutes())}.zip`;
};

export { createBackup, getBackupFileName, InvalidBackupError, readBackup };
