"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useUIStore } from "@/lib/store/useUIStore";
import { useUnseenAlertMatchCount } from "@/lib/hooks/useAlertRules";

type Theme = "dark" | "light";

export function Topbar() {
  const router = useRouter();
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const alertCount = useUnseenAlertMatchCount();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }
  // Starts as "dark" to match the server-rendered `<html class="dark …">`
  // default (see app/layout.tsx) — reading the real, possibly-"light" DOM
  // class here during the initial render would make this component's first
  // client render disagree with what the server sent, triggering a
  // hydration mismatch. The effect below corrects it once mounted.
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

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

        <button
          type="button"
          className="inline-flex rounded-md p-2 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="size-5" />
        </button>
      </div>
    </header>
  );
}
