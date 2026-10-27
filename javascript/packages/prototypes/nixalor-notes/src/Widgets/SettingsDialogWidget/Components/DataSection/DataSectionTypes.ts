type BackupStatus =
  | { type: "idle" }
  | { type: "working" }
  | { type: "done"; message: string }
  | { type: "error"; message: string };

export type { BackupStatus };
