import { useTheme } from "@/hooks/use-theme";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";

const CYCLE: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];

export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  function handleClick() {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  }

  const label = t("切换主题（浅色 / 深色 / 跟随系统）");

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={cn("theme-toggle", className)}
    >
      <Sun
        aria-hidden="true"
        strokeWidth={1.75}
        className="theme-toggle__icon theme-toggle__icon--light"
      />
      <Moon
        aria-hidden="true"
        strokeWidth={1.75}
        className="theme-toggle__icon theme-toggle__icon--dark"
      />
      <Monitor
        aria-hidden="true"
        strokeWidth={1.75}
        className="theme-toggle__icon theme-toggle__icon--system"
      />
    </button>
  );
}
