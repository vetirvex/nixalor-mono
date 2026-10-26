import { memo, useEffect, useState } from "react";
import { BoardIcon } from "../../Shared/Icons/Icons";
import { getBoardPreviewUrl } from "../../Shared/Utils/boardPreview";
import classes from "./DrawingThumbnail.module.css";
import type { DrawingThumbnailProps } from "./DrawingThumbnailTypes";

const DrawingThumbnail = memo<DrawingThumbnailProps>(
  ({ drawingId, updatedAt, className }) => {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      void getBoardPreviewUrl(drawingId, updatedAt).then(
        (url) => !cancelled && setSrc(url)
      );
      return () => {
        cancelled = true;
      };
    }, [drawingId, updatedAt]);

    return (
      <span className={[classes.drawingThumbnail, className].filter(Boolean).join(" ")}>
        {src ? (
          <img src={src} alt="" className={classes.image} draggable={false} />
        ) : (
          <BoardIcon size={22} className={classes.placeholder} />
        )}
      </span>
    );
  }
);
DrawingThumbnail.displayName = "DrawingThumbnail";

export { DrawingThumbnail };
