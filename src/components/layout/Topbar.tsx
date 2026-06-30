"use client";

import { Bell, ChevronDown, HelpCircle, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LiveClock } from "@/components/layout/LiveClock";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/lib/store/useUIStore";
import { useLiveAlertFeed } from "@/lib/hooks/useAlerts";

export function Topbar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const { data: liveAlerts } = useLiveAlertFeed();
  const alertCount = liveAlerts?.length ?? 36;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-surface-border bg-surface-1/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-1/80 sm:px-6">
      <button
        className="rounded-md p-1.5 hover:bg-surface-3 md:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>
      <button
        className="hidden rounded-md p-1.5 hover:bg-surface-3 md:inline-flex"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </button>

      <LiveClock />

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-1.5 rounded-full border border-surface-border bg-surface-2 px-3 py-1 text-xs font-medium text-status-active sm:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-status-active" />
          System Online
        </div>

        <button
          className="relative rounded-md p-2 hover:bg-surface-3"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {alertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {alertCount}
            </span>
          )}
        </button>

        <button className="hidden rounded-md p-2 hover:bg-surface-3 sm:inline-flex" aria-label="Help">
          <HelpCircle className="size-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 pr-1.5 hover:bg-surface-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-surface-3 text-xs">AD</AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight md:block">
                <div className="text-sm font-medium">Admin</div>
                <div className="text-[11px] text-muted-foreground">Super Administrator</div>
              </div>
              <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Account Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
