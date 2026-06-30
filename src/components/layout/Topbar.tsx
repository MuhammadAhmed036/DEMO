"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useUIStore } from "@/lib/store/useUIStore";
import { useLiveAlertFeed } from "@/lib/hooks/useAlerts";

type Theme = "dark" | "light";

export function Topbar() {
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const { data: liveAlerts } = useLiveAlertFeed();
  const alertCount = liveAlerts?.length ?? 36;
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // The theme still changes for this session when storage is unavailable.
    }
    setTheme(nextTheme);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-surface-border bg-surface-1/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-1/80 sm:px-6">
      <button
        className="rounded-md p-1.5 hover:bg-surface-3 md:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/alerts"
          className="relative inline-flex rounded-md p-2 transition-colors hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="size-5" />
          {alertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {alertCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          className="inline-flex rounded-md p-2 transition-colors hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </div>
    </header>
  );
}
