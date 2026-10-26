interface SettingsDialogWidgetProps {
  onClose: () => void;
}

type SettingsSection = "appearance" | "shortcuts";

export type { SettingsDialogWidgetProps, SettingsSection };
