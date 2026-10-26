import { convertToExcalidrawElements, getCommonBounds } from "@excalidraw/excalidraw";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import type { MessageKey, MessageParams } from "../I18n/I18nTypes";
import { buildSceneContent } from "./scene";
import type { SceneContent } from "./scene";

// Mirrors --sidebar-width and --topbar-height in Tokens.css.
const SIDEBAR_WIDTH = 272;
const TOPBAR_HEIGHT = 56;

type TemplateId = "blank" | "system" | "userFlow" | "mindmap" | "retro";

type Translate = (key: MessageKey, params?: MessageParams) => string;

const box = (
  id: string,
  x: number,
  y: number,
  text: string,
  extra: Partial<ExcalidrawElementSkeleton> = {}
): ExcalidrawElementSkeleton =>
  ({
    type: "rectangle",
    id,
    x,
    y,
    width: 180,
    height: 72,
    roundness: { type: 3 },
    label: { text },
    ...extra,
  }) as ExcalidrawElementSkeleton;

const arrow = (
  from: string,
  to: string,
  x: number,
  y: number
): ExcalidrawElementSkeleton =>
  ({
    type: "arrow",
    x,
    y,
    start: { id: from },
    end: { id: to },
  }) as ExcalidrawElementSkeleton;

const SKELETONS: Record<
  Exclude<TemplateId, "blank">,
  (t: Translate) => ExcalidrawElementSkeleton[]
> = {
  system: (t) => [
    box("client", 0, 0, t("template.system.client")),
    box("api", 300, 0, t("template.system.api"), {
      backgroundColor: "#ffec99",
      fillStyle: "solid",
    }),
    box("db", 600, -80, t("template.system.db")),
    box("queue", 600, 80, t("template.system.queue")),
    arrow("client", "api", 180, 36),
    arrow("api", "db", 480, 36),
    arrow("api", "queue", 480, 36),
  ],
  userFlow: (t) => [
    {
      type: "ellipse",
      id: "start",
      x: 0,
      y: 0,
      width: 140,
      height: 72,
      label: { text: t("template.userFlow.start") },
    } as ExcalidrawElementSkeleton,
    box("step1", 240, 0, t("template.userFlow.step1")),
    box("step2", 520, 0, t("template.userFlow.step2")),
    {
      type: "ellipse",
      id: "done",
      x: 800,
      y: 0,
      width: 140,
      height: 72,
      label: { text: t("template.userFlow.done") },
      backgroundColor: "#b2f2bb",
      fillStyle: "solid",
    } as ExcalidrawElementSkeleton,
    arrow("start", "step1", 140, 36),
    arrow("step1", "step2", 420, 36),
    arrow("step2", "done", 700, 36),
  ],
  mindmap: (t) => {
    const branches = [
      [-320, -180],
      [320, -180],
      [-320, 180],
      [320, 180],
    ] as const;
    return [
      {
        type: "ellipse",
        id: "center",
        x: -110,
        y: -50,
        width: 220,
        height: 100,
        label: { text: t("template.mindmap.center") },
        backgroundColor: "#ffec99",
        fillStyle: "solid",
      } as ExcalidrawElementSkeleton,
      ...branches.flatMap(([x, y], index) => [
        box(
          `branch${index}`,
          x - 90,
          y - 36,
          t("template.mindmap.branch", { n: index + 1 })
        ),
        arrow("center", `branch${index}`, 0, 0),
      ]),
    ];
  },
  retro: (t) =>
    (
      [
        ["good", "template.retro.good", "#b2f2bb"],
        ["bad", "template.retro.bad", "#ffc9c9"],
        ["actions", "template.retro.actions", "#a5d8ff"],
      ] as const
    ).flatMap(([id, key, color], index) => [
      {
        type: "text",
        x: index * 320,
        y: -60,
        text: t(key),
        fontSize: 24,
      } as ExcalidrawElementSkeleton,
      {
        type: "rectangle",
        id,
        x: index * 320,
        y: 0,
        width: 280,
        height: 420,
        backgroundColor: color,
        fillStyle: "hachure",
        roundness: { type: 3 },
      } as ExcalidrawElementSkeleton,
    ]),
};

/** Builds the initial content for a new board from a template (null for blank). */
const buildTemplateScene = (template: TemplateId, t: Translate): SceneContent | null => {
  if (template === "blank") {
    return null;
  }
  const elements = convertToExcalidrawElements(SKELETONS[template](t), {
    regenerateIds: true,
  });
  // Center the template in the canvas area (window minus sidebar and top bar).
  const [minX, minY, maxX, maxY] = getCommonBounds(elements);
  const viewportWidth = window.innerWidth - SIDEBAR_WIDTH;
  const viewportHeight = window.innerHeight - TOPBAR_HEIGHT;
  return buildSceneContent(
    elements,
    {
      scrollX: (viewportWidth - (maxX - minX)) / 2 - minX,
      scrollY: (viewportHeight - (maxY - minY)) / 2 - minY,
    },
    {}
  );
};

export { buildTemplateScene };
export type { TemplateId };
