import { Outlet, useLocation } from "react-router-dom";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHelpAlert } from "@/components/page-help-alert";
import { ToolsDropdown } from "@/components/tools-dropdown";
import { useAvailableTools } from "@/hooks/use-available-tools";
import { t } from "@/i18n";
import { toolGroups } from "./routes";

const GROUP_LABELS: Record<keyof typeof toolGroups, string> = {
  network: t("网络检测"),
  browser: t("浏览器检测"),
  ai: t("AI 检测"),
};

export function ToolLayout({ group }: { group: keyof typeof toolGroups }) {
  const tools = useAvailableTools(group);
  const { pathname } = useLocation();
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const currentTool = tools.find((tool) => tool.path === cleanPath);

  const crumbs = [
    { label: t("首页"), href: "/" },
    { label: GROUP_LABELS[group], href: `/${group}` },
    ...(currentTool ? [{ label: currentTool.label }] : []),
  ];

  return (
    <>
      <div className="content-header">
        <Breadcrumb items={crumbs} />
        <ToolsDropdown />
      </div>
      <PageHelpAlert />
      <Outlet />
    </>
  );
}
