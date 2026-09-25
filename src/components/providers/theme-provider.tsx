import type { PropsWithChildren } from "react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeProvider({ children }: PropsWithChildren) {
  // useTheme already syncs data-theme / data-theme-choice / .dark / colorScheme
  // on every render and exposes window.oneIpTheme. Nothing to do here.
  useTheme();
  return <>{children}</>;
}
