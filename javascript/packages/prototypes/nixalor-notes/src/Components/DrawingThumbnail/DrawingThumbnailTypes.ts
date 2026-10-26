interface DrawingThumbnailProps {
  drawingId: string;
  /** Part of the cache key, so the preview refreshes after edits. */
  updatedAt: number;
  className?: string;
}

export type { DrawingThumbnailProps };
