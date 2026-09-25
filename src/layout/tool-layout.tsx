import { Outlet } from "react-router-dom";
import { PageHelpAlert } from "@/components/page-help-alert";

/**
 * Layout shared by the 3 tool groups (network / browser / ai).
 *
 * The `group` prop is retained for route compatibility but is no longer
 * needed at this level — the top nav now drives navigation between tools
 * via hover-dropdown submenus.
 */
export function ToolLayout({
  group: _group,
}: {
  group: "network" | "browser" | "ai";
}) {
  return (
    <>
      <PageHelpAlert />
      <Outlet />
    </>
  );
}
