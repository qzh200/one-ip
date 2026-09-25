import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type NavGroupTool = { path: string; label: string };

/**
 * Top-nav group trigger with hover AND click submenu.
 *
 * Behavior:
 * - Opens on mouseenter on the wrapper, closes on mouseleave (with 150ms delay
 *   so the user can move the cursor into the menu without it dismissing).
 * - Click on the trigger button (label or caret) toggles open/closed.
 * - Closes on Escape and on `mousedown` outside the wrapper.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cleanup any pending close timer on unmount.
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

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
        <span className="nav-group-dropdown__label">{label}</span>
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
