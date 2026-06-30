"use client";

import { useState } from "react";
import { Brain, Camera as CameraIcon, Clock, HardDrive, MapPinned, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useOperators } from "@/lib/hooks/useOperators";
import { initialsFromName } from "@/lib/formatters";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/mock/alert-types";

const NOTIFICATION_CHANNELS = ["Email", "SMS", "In-App", "Push"];

export default function SettingsPage() {
  const { data: operators, isLoading } = useOperators();
  const [channelState, setChannelState] = useState<Record<string, boolean>>({
    Email: true,
    SMS: false,
    "In-App": true,
    Push: true,
  });
  const [severityState, setSeverityState] = useState<Record<string, boolean>>({
    critical: true,
    high: true,
    medium: true,
    low: false,
  });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Settings" description="Manage your profile, notifications, operators, and system preferences" />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="max-w-xl space-y-4 rounded-xl border border-surface-border bg-surface-2 p-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarFallback className="bg-surface-3 text-lg">AD</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">Admin</div>
                <div className="text-sm text-muted-foreground">Super Administrator</div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" defaultValue="Admin User" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="admin@safecity.ai" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+92 300 1234567" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="control-room">Control Room</Label>
                <Input id="control-room" defaultValue="Control Room 1" disabled />
              </div>
            </div>
            <Button className="gap-1.5"><Save className="size-4" /> Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className="max-w-xl space-y-5 rounded-xl border border-surface-border bg-surface-2 p-5">
            <div>
              <h3 className="mb-2 text-sm font-medium">Notification Channels</h3>
              <div className="space-y-2.5">
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <div key={channel} className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-1 px-3 py-2.5">
                    <span className="text-sm">{channel}</span>
                    <Switch
                      checked={channelState[channel]}
                      onCheckedChange={(checked) =>
                        setChannelState((prev) => ({ ...prev, [channel]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Notify Me For</h3>
              <div className="space-y-2.5">
                {SEVERITY_ORDER.map((s) => (
                  <div key={s} className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-1 px-3 py-2.5">
                    <span className="text-sm">{SEVERITY_LABEL[s]} Alerts</span>
                    <Switch
                      checked={severityState[s]}
                      onCheckedChange={(checked) => setSeverityState((prev) => ({ ...prev, [s]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operators" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-surface-border">
            {isLoading && (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
            {operators && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-border bg-surface-2 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Operator</th>
                    <th className="px-4 py-3 font-medium">Control Room</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {operators.map((op) => (
                    <tr key={op.id}>
                      <td className="flex items-center gap-2.5 px-4 py-3">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-surface-3 text-[11px]">
                            {initialsFromName(op.name)}
                          </AvatarFallback>
                        </Avatar>
                        {op.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{op.controlRoom}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-status-active">
                          <span className="size-1.5 rounded-full bg-status-active" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
              <h3 className="mb-3 text-sm font-medium">System Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><Brain className="size-4" /> AI Models</span>
                  <span className="font-medium">12 Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><CameraIcon className="size-4" /> Video Feeds</span>
                  <span className="font-medium">231 Live</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><HardDrive className="size-4" /> Storage</span>
                  <span className="font-medium">78.6 TB / 100 TB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" /> System Uptime</span>
                  <span className="font-medium">24d 14h 32m</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <MapPinned className="size-4" /> Map Data Source
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">Local PMTiles (offline)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Coverage</span>
                  <span className="font-medium">Islamabad Capital Territory</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bounds</span>
                  <span className="font-medium">72.7°E–73.4°E, 33.45°N–33.95°N</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Zoom Range</span>
                  <span className="font-medium">9 – 18</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
