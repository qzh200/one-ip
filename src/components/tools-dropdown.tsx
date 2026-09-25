import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "@/i18n";
import { navigationRoutes, toolGroups } from "@/layout/routes";
import { LayoutGrid, Check } from "lucide-react";

const GROUP_LABELS: Record<keyof typeof toolGroups, string> = {
  network: t("网络检测"),
  browser: t("浏览器检测"),
  ai: t("AI 检测"),
};

function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

export function ToolsDropdown() {
  const { pathname } = useLocation();
  const activePath = normalizePath(pathname);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="tools-dropdown__trigger">
          <LayoutGrid aria-hidden="true" />
          <span>{t("工具列表")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tools-dropdown__content">
        <DropdownMenuItem asChild>
          <Link to="/" className="tools-dropdown__item">
            {t("首页")}
            {activePath === "/" && (
              <Check aria-hidden="true" className="ml-auto" />
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {navigationRoutes.slice(1).map((route) => {
          if (route.value === "/status/") return null;
          const groupKey = route.value.replace(
            /\//g,
            "",
          ) as keyof typeof toolGroups;
          const tools = toolGroups[groupKey];
          if (!tools) return null;
          const routePath = normalizePath(route.value);
          return (
            <div key={route.value}>
              <DropdownMenuLabel>
                {GROUP_LABELS[groupKey] || route.label}
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={route.value} className="tools-dropdown__item">
                  {t("概述")}
                  {activePath === routePath && (
                    <Check aria-hidden="true" className="ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>
              {tools.map((tool) => (
                <DropdownMenuItem key={tool.path} asChild>
                  <Link to={tool.path} className="tools-dropdown__item">
                    {tool.label}
                    {activePath === tool.path && (
                      <Check aria-hidden="true" className="ml-auto" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
