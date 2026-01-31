import { Colors } from "../constants/theme";
import { useColorScheme } from "./use-color-scheme";

type ThemeProps = { light?: string; dark?: string } | undefined;

export function useThemeColor(
  props: ThemeProps,
  colorName: keyof typeof Colors.light | string,
) {
  const theme = useColorScheme() ?? "light";

  // if specific light/dark override provided, use it
  if (props) {
    const override = theme === "dark" ? props.dark : props.light;
    if (override) return override;
  }

  // fallback to Colors map when colorName matches
  if ((Colors as any)[theme] && (Colors as any)[theme][colorName]) {
    return (Colors as any)[theme][colorName];
  }

  // last resort
  return theme === "dark" ? Colors.dark.text : Colors.light.text;
}

export default useThemeColor;
