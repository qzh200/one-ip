import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type NavGroupTool = { path: string; label: string };

/**
 * Top-nav group trigger with a hover- and click-driven submenu.
 *
 * Behavior:
 * - Opens on `mouseenter` (and closes on `mouseleave` with a small grace period
 *   so the cursor can travel into the dropdown without it collapsing).
 * - Opens/toggles on click for touch and keyboard accessibility.
 * - Closes on `mousedown` outside the wrapper, on `Escape`, and after any
 *   menu item is selected.
 * - The label itself is also a link to the group's overview, so clicking the
 *   label navigates while clicking the surrounding button area toggles.
 */
export function NavGroupDropdown({
  label,
  overviewPath,
  tools,
  isActive,
}: {
  label: string;
  overviewPath: string;
  tools: readonly NavGroupTool[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function openNow() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 150);
  }

  // Close on click outside the wrapper.
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      const node = containerRef.current;
      if (node && !node.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "nav-group-dropdown",
        open && "is-open",
        isActive && "is-active",
      )}
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="nav-group-dropdown__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Link
          to={overviewPath}
          className="nav-group-dropdown__label"
          onClick={(event) => {
            // The label is the link; clicking it navigates and closes any
            // open menu. Stop propagation so the wrapping button's click
            // handler does not also fire (and re-toggle the menu).
            event.stopPropagation();
            setOpen(false);
          }}
        >
          {label}
        </Link>
        <ChevronDown aria-hidden="true" className="nav-group-dropdown__caret" />
      </button>
      {open && (
        <div className="nav-group-dropdown__menu" role="menu">
          <Link
            to={overviewPath}
            className="nav-group-dropdown__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("概述")}
          </Link>
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="nav-group-dropdown__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {tool.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
