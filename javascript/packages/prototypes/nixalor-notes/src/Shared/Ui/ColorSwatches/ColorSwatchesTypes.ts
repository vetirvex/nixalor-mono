interface ColorSwatchOption<T extends string> {
  value: T;
  hex: string;
  label: string;
}

interface ColorSwatchesProps<T extends string> {
  value: T;
  options: ColorSwatchOption<T>[];
  onChange: (value: T) => void;
  label: string;
  size?: "md" | "sm";
}

export type { ColorSwatchesProps, ColorSwatchOption };
