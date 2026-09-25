import { useSyncExternalStore } from "react";
import { themeAtom, type Theme } from "@/store/theme";
import { useAtom } from "jotai";

const query = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function applyThemeAttrs(choice: Theme, resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themeChoice = choice;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

function exposeWindowApi(get: () => Theme, set: (next: Theme) => void) {
  (
    window as unknown as {
      oneIpTheme?: { get: () => Theme; set: (n: Theme) => void };
    }
  ).oneIpTheme = { get, set };
}

export function useTheme() {
  const [theme, updateTheme] = useAtom(themeAtom);
  const isDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
  const systemTheme: "light" | "dark" = isDark ? "dark" : "light";
  const resolvedTheme: "light" | "dark" =
    theme === "system" ? systemTheme : theme;

  const setTheme = (next: Theme) => {
    const resolved = next === "system" ? systemTheme : next;
    applyThemeAttrs(next, resolved);
    updateTheme(next);
  };

  // Expose window API on first mount (idempotent).
  if (
    typeof window !== "undefined" &&
    !(window as { oneIpTheme?: unknown }).oneIpTheme
  ) {
    exposeWindowApi(
      () => theme,
      (next) => setTheme(next),
    );
  }

  return { theme, setTheme, systemTheme, resolvedTheme };
}
