import type {
  Attachment,
  Drawing,
  DrawingScene,
  Folder,
  NoteContent,
  NotesSnapshot,
} from "./StorageTypes";

const DB_NAME = "nixalor-notes";
const DB_VERSION = 3;

const FOLDERS = "folders";
const DRAWINGS = "drawings";
const SCENES = "scenes";
const NOTES = "notes";
const ATTACHMENTS = "attachments";

type StoreName =
  typeof FOLDERS | typeof DRAWINGS | typeof SCENES | typeof NOTES | typeof ATTACHMENTS;

const promisifyRequest = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const promisifyTransaction = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = () => {
  if (!dbPromise) {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FOLDERS)) {
        db.createObjectStore(FOLDERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DRAWINGS)) {
        db.createObjectStore(DRAWINGS, { keyPath: "id" }).createIndex(
          "folderId",
          "folderId"
        );
      }
      if (!db.objectStoreNames.contains(SCENES)) {
        db.createObjectStore(SCENES, { keyPath: "id" });
      }
      // v2: Markdown notes.
      if (!db.objectStoreNames.contains(NOTES)) {
        db.createObjectStore(NOTES, { keyPath: "id" });
      }
      // v3: images embedded in notes.
      if (!db.objectStoreNames.contains(ATTACHMENTS)) {
        db.createObjectStore(ATTACHMENTS, { keyPath: "id" }).createIndex(
          "noteId",
          "noteId"
        );
      }
    };
    dbPromise = promisifyRequest(request).then((db) => {
      // Another tab is upgrading the schema — let it, and reconnect on next use.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      return db;
    });
  }
  return dbPromise;
};

const runTransaction = async (
  stores: StoreName[],
  run: (transaction: IDBTransaction) => void
) => {
  const db = await openDb();
  const transaction = db.transaction(stores, "readwrite");
  run(transaction);
  return promisifyTransaction(transaction);
};

const getAll = async <T>(store: StoreName) => {
  const db = await openDb();
  return promisifyRequest<T[]>(db.transaction(store).objectStore(store).getAll());
};

const NotesDb = {
  getFolders: () => getAll<Folder>(FOLDERS),

  getDrawings: () => getAll<Drawing>(DRAWINGS),

  putFolder: (folder: Folder) =>
    runTransaction([FOLDERS], (tx) => tx.objectStore(FOLDERS).put(folder)),

  putDrawing: (drawing: Drawing) =>
    runTransaction([DRAWINGS], (tx) => tx.objectStore(DRAWINGS).put(drawing)),

  /** Creates a board with its scene, or a note with its text, in one transaction. */
  createFile: (drawing: Drawing, body: { scene: DrawingScene } | { note: NoteContent }) =>
    runTransaction([DRAWINGS, SCENES, NOTES], (tx) => {
      tx.objectStore(DRAWINGS).put(drawing);
      if ("scene" in body) {
        tx.objectStore(SCENES).put(body.scene);
      } else {
        tx.objectStore(NOTES).put(body.note);
      }
    }),

  /** Removes folders and files (with their content and images) atomically. */
  deleteItems: (folderIds: string[], drawingIds: string[]) =>
    runTransaction([FOLDERS, DRAWINGS, SCENES, NOTES, ATTACHMENTS], (tx) => {
      folderIds.forEach((id) => tx.objectStore(FOLDERS).delete(id));
      const attachments = tx.objectStore(ATTACHMENTS);
      drawingIds.forEach((id) => {
        tx.objectStore(DRAWINGS).delete(id);
        tx.objectStore(SCENES).delete(id);
        tx.objectStore(NOTES).delete(id);
        attachments.index("noteId").getAllKeys(IDBKeyRange.only(id)).onsuccess = (
          event
        ) => {
          const keys = (event.target as IDBRequest<IDBValidKey[]>).result;
          keys.forEach((key) => attachments.delete(key));
        };
      });
    }),

  putAttachments: (items: Attachment[]) =>
    runTransaction([ATTACHMENTS], (tx) =>
      items.forEach((item) => tx.objectStore(ATTACHMENTS).put(item))
    ),

  getAttachment: async (id: string) => {
    const db = await openDb();
    const item = await promisifyRequest<Attachment | undefined>(
      db.transaction(ATTACHMENTS).objectStore(ATTACHMENTS).get(id)
    );
    return item ?? null;
  },

  getNoteAttachments: async (noteId: string) => {
    const db = await openDb();
    return promisifyRequest<Attachment[]>(
      db
        .transaction(ATTACHMENTS)
        .objectStore(ATTACHMENTS)
        .index("noteId")
        .getAll(IDBKeyRange.only(noteId))
    );
  },

  deleteAttachments: (ids: string[]) =>
    runTransaction([ATTACHMENTS], (tx) =>
      ids.forEach((id) => tx.objectStore(ATTACHMENTS).delete(id))
    ),

  getNote: async (id: string) => {
    const db = await openDb();
    const note = await promisifyRequest<NoteContent | undefined>(
      db.transaction(NOTES).objectStore(NOTES).get(id)
    );
    return note ?? null;
  },

  /** Saves the note text and bumps the file's updatedAt in one transaction. */
  saveNote: (note: NoteContent, drawing: Drawing) =>
    runTransaction([DRAWINGS, NOTES], (tx) => {
      tx.objectStore(NOTES).put(note);
      tx.objectStore(DRAWINGS).put(drawing);
    }),

  getScene: async (id: string) => {
    const db = await openDb();
    const scene = await promisifyRequest<DrawingScene | undefined>(
      db.transaction(SCENES).objectStore(SCENES).get(id)
    );
    return scene ?? null;
  },

  /** Saves the scene and bumps the drawing's updatedAt in one transaction. */
  saveScene: (scene: DrawingScene, drawing: Drawing) =>
    runTransaction([DRAWINGS, SCENES], (tx) => {
      tx.objectStore(SCENES).put(scene);
      tx.objectStore(DRAWINGS).put(drawing);
    }),

  /** Everything in the database, for a backup. */
  getSnapshot: async (): Promise<NotesSnapshot> => {
    const db = await openDb();
    const tx = db.transaction([FOLDERS, DRAWINGS, SCENES, NOTES, ATTACHMENTS]);
    const [folders, drawings, scenes, notes, attachments] = await Promise.all([
      promisifyRequest<Folder[]>(tx.objectStore(FOLDERS).getAll()),
      promisifyRequest<Drawing[]>(tx.objectStore(DRAWINGS).getAll()),
      promisifyRequest<DrawingScene[]>(tx.objectStore(SCENES).getAll()),
      promisifyRequest<NoteContent[]>(tx.objectStore(NOTES).getAll()),
      promisifyRequest<Attachment[]>(tx.objectStore(ATTACHMENTS).getAll()),
    ]);
    return { folders, drawings, scenes, notes, attachments };
  },

  /**
   * Restores a backup atomically: records are written by id, so items from the
   * backup replace their current versions and everything else stays.
   */
  restoreSnapshot: (snapshot: NotesSnapshot) =>
    runTransaction([FOLDERS, DRAWINGS, SCENES, NOTES, ATTACHMENTS], (tx) => {
      snapshot.folders.forEach((item) => tx.objectStore(FOLDERS).put(item));
      snapshot.drawings.forEach((item) => tx.objectStore(DRAWINGS).put(item));
      snapshot.scenes.forEach((item) => tx.objectStore(SCENES).put(item));
      snapshot.notes.forEach((item) => tx.objectStore(NOTES).put(item));
      const attachments = tx.objectStore(ATTACHMENTS);
      snapshot.attachments.forEach((item) => attachments.put(item));
      // A restored note gets exactly the images from the backup.
      const restoredIds = new Set(snapshot.attachments.map((item) => item.id));
      snapshot.notes.forEach((note) => {
        attachments.index("noteId").getAllKeys(IDBKeyRange.only(note.id)).onsuccess = (
          event
        ) => {
          const keys = (event.target as IDBRequest<IDBValidKey[]>).result;
          keys
            .filter((key) => !restoredIds.has(String(key)))
            .forEach((key) => attachments.delete(key));
        };
      });
    }),
};

export { NotesDb };
