import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";
import type { DrawingScene } from "../Storage/StorageTypes";

type SceneContent = Omit<DrawingScene, "id">;

/**
 * Keeps only what is worth storing: live elements, the files they reference
 * and the few app-state fields that describe the board itself.
 */
const buildSceneContent = (
  elements: readonly OrderedExcalidrawElement[],
  appState: Partial<DrawingScene["appState"]>,
  files: BinaryFiles
): SceneContent => {
  const liveElements = elements.filter((element) => !element.isDeleted);
  const usedFileIds = new Set<string>(
    liveElements.flatMap((element) =>
      element.type === "image" && element.fileId ? [element.fileId] : []
    )
  );
  const usedFiles: BinaryFiles = {};
  for (const [fileId, file] of Object.entries(files)) {
    if (usedFileIds.has(fileId)) {
      usedFiles[fileId] = file;
    }
  }
  return {
    elements: liveElements,
    appState: {
      viewBackgroundColor: appState.viewBackgroundColor ?? "#ffffff",
      scrollX: appState.scrollX ?? 0,
      scrollY: appState.scrollY ?? 0,
      zoom: appState.zoom ?? { value: 1 as DrawingScene["appState"]["zoom"]["value"] },
      gridModeEnabled: appState.gridModeEnabled ?? false,
    },
    files: usedFiles,
  };
};

export { buildSceneContent };
export type { SceneContent };
