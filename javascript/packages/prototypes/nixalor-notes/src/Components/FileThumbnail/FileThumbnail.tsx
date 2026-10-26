import { memo } from "react";
import { getFileKind } from "../../Shared/Storage/StorageTypes";
import { DrawingThumbnail } from "../DrawingThumbnail/DrawingThumbnail";
import { NoteThumbnail } from "../NoteThumbnail/NoteThumbnail";
import type { FileThumbnailProps } from "./FileThumbnailTypes";

/** Board drawing preview or note text preview, depending on the file kind. */
const FileThumbnail = memo<FileThumbnailProps>(({ file, className }) =>
  getFileKind(file) === "note" ? (
    <NoteThumbnail noteId={file.id} updatedAt={file.updatedAt} className={className} />
  ) : (
    <DrawingThumbnail
      drawingId={file.id}
      updatedAt={file.updatedAt}
      className={className}
    />
  )
);
FileThumbnail.displayName = "FileThumbnail";

export { FileThumbnail };
