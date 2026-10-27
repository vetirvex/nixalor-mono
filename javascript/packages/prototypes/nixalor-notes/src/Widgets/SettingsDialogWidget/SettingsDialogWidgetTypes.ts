interface SettingsDialogWidgetProps {
  onClose: () => void;
}

type SettingsSection = "appearance" | "shortcuts" | "data";

export type { SettingsDialogWidgetProps, SettingsSection };
