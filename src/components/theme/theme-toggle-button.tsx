import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

export function ThemeToggleButton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const buttonLabel =
    label ??
    (resolvedTheme === "dark" ? t("切换为浅色模式") : t("切换为深色模式"));

  function handleToggle(_event: MouseEvent<HTMLButtonElement>) {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      aria-label={buttonLabel}
      title={buttonLabel}
      className={cn("shrink-0 rounded-lg shadow-none", className)}
      onClick={handleToggle}
      size="icon-sm"
      variant="ghost"
    >
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
    </Button>
  );
}
