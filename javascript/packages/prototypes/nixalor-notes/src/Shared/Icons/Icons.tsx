import { memo } from "react";
import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

// Stroke icons on a 24x24 grid, 2px stroke (lucide-style).
const createIcon = (displayName: string, paths: ReactNode, filled = false) => {
  const Icon = memo<IconProps>(({ size = 16, ...rest }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths}
    </svg>
  ));
  Icon.displayName = displayName;
  return Icon;
};

const ChevronRightIcon = createIcon("ChevronRightIcon", <path d="m9 18 6-6-6-6" />);

/** Hand-drawn stroke used for boards in lists, as in the design. */
const BoardIcon = createIcon(
  "BoardIcon",
  <path d="M4 17c2.5-1 3.5-5 6-5s2 3 4.5 3S18 9 20 7" />
);

const SearchIcon = createIcon(
  "SearchIcon",
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>
);

const StarIcon = createIcon(
  "StarIcon",
  <path d="M12 3.5 14.6 9l5.9.6-4.4 4 1.3 5.9L12 16.6l-5.4 2.9 1.3-5.9-4.4-4 5.9-.6z" />
);

const StarFilledIcon = createIcon(
  "StarFilledIcon",
  <path d="M12 3.5 14.6 9l5.9.6-4.4 4 1.3 5.9L12 16.6l-5.4 2.9 1.3-5.9-4.4-4 5.9-.6z" />,
  true
);

const PlusIcon = createIcon("PlusIcon", <path d="M12 5v14M5 12h14" />);

const MoreIcon = createIcon(
  "MoreIcon",
  <>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </>
);

const CloseIcon = createIcon("CloseIcon", <path d="M18 6 6 18M6 6l12 12" />);

const CheckIcon = createIcon("CheckIcon", <path d="m5 12 5 5 9-10" />);

const SettingsIcon = createIcon(
  "SettingsIcon",
  <>
    <path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.6a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.6a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

const PencilIcon = createIcon(
  "PencilIcon",
  <>
    <path d="M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" />
    <path d="m15 5 4 4" />
  </>
);

const TrashIcon = createIcon(
  "TrashIcon",
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>
);

const CopyIcon = createIcon(
  "CopyIcon",
  <>
    <rect width="13" height="13" x="9" y="9" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>
);

const DownloadIcon = createIcon(
  "DownloadIcon",
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </>
);

const ImportIcon = createIcon(
  "ImportIcon",
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m17 8-5-5-5 5" />
    <path d="M12 3v12" />
  </>
);

const MoveIcon = createIcon(
  "MoveIcon",
  <>
    <path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1" />
    <path d="M2 13h10" />
    <path d="m9 16 3-3-3-3" />
  </>
);

const FolderIcon = createIcon(
  "FolderIcon",
  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
);

const FolderFilledIcon = createIcon(
  "FolderFilledIcon",
  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
  true
);

const ListIcon = createIcon(
  "ListIcon",
  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
);

const TilesIcon = createIcon(
  "TilesIcon",
  <>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
  </>
);

const SidebarIcon = createIcon(
  "SidebarIcon",
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </>
);

const SaveIcon = createIcon(
  "SaveIcon",
  <>
    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
    <path d="M7 3v4a1 1 0 0 0 1 1h7" />
  </>
);

const SunIcon = createIcon(
  "SunIcon",
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
);

const MoonIcon = createIcon("MoonIcon", <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);

const MonitorIcon = createIcon(
  "MonitorIcon",
  <>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </>
);

const KeyboardIcon = createIcon(
  "KeyboardIcon",
  <>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 15h6" />
  </>
);

const PaletteIcon = createIcon(
  "PaletteIcon",
  <>
    <path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 22z" />
    <circle cx="7.5" cy="10.5" r="1" />
    <circle cx="12" cy="7.5" r="1" />
    <circle cx="16.5" cy="10.5" r="1" />
  </>
);

// Template previews in the create dialog.
const TemplateSystemIcon = createIcon(
  "TemplateSystemIcon",
  <>
    <rect width="7" height="5" x="2" y="5" rx="1" />
    <rect width="7" height="5" x="15" y="14" rx="1" />
    <path d="M9 7.5h3v9h3" />
  </>
);

const TemplateFlowIcon = createIcon(
  "TemplateFlowIcon",
  <>
    <circle cx="4" cy="12" r="2" />
    <rect width="5" height="4" x="9.5" y="10" rx="1" />
    <circle cx="20" cy="12" r="2" />
    <path d="M6 12h3.5M14.5 12H18" />
  </>
);

const TemplateMindmapIcon = createIcon(
  "TemplateMindmapIcon",
  <>
    <circle cx="12" cy="12" r="3" />
    <circle cx="4" cy="5" r="1.5" />
    <circle cx="20" cy="5" r="1.5" />
    <circle cx="4" cy="19" r="1.5" />
    <circle cx="20" cy="19" r="1.5" />
    <path d="m5.2 6.1 4.6 3.8M18.8 6.1l-4.6 3.8M5.2 17.9l4.6-3.8M18.8 17.9l-4.6-3.8" />
  </>
);

const TemplateRetroIcon = createIcon(
  "TemplateRetroIcon",
  <>
    <rect width="5" height="16" x="2" y="4" rx="1" />
    <rect width="5" height="16" x="9.5" y="4" rx="1" />
    <rect width="5" height="16" x="17" y="4" rx="1" />
  </>
);

const NoteIcon = createIcon(
  "NoteIcon",
  <>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M8 13h8M8 17h5" />
  </>
);

const EyeIcon = createIcon(
  "EyeIcon",
  <>
    <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
    <circle cx="12" cy="12" r="3" />
  </>
);

const OutlineIcon = createIcon(
  "OutlineIcon",
  <>
    <path d="M3 5h12M7 10h12M7 15h10M11 20h8" />
    <circle cx="3.5" cy="10" r="0.5" />
  </>
);

export {
  BoardIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FolderFilledIcon,
  FolderIcon,
  ImportIcon,
  KeyboardIcon,
  ListIcon,
  MonitorIcon,
  MoonIcon,
  MoreIcon,
  MoveIcon,
  NoteIcon,
  OutlineIcon,
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  SettingsIcon,
  SidebarIcon,
  StarFilledIcon,
  StarIcon,
  SunIcon,
  TemplateFlowIcon,
  TemplateMindmapIcon,
  TemplateRetroIcon,
  TemplateSystemIcon,
  TilesIcon,
  TrashIcon,
};
