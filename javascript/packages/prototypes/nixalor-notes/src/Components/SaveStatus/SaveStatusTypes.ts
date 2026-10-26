type SaveStatusValue = "saved" | "unsaved" | "saving" | "error";

interface SaveStatusProps {
  status: SaveStatusValue;
  onSave: () => void;
}

export type { SaveStatusProps, SaveStatusValue };
