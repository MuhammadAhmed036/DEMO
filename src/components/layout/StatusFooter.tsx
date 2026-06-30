import { Brain, Camera as CameraIcon, Clock, HardDrive } from "lucide-react";

const items = [
  { icon: Brain, label: "AI Models", value: "12 Active" },
  { icon: CameraIcon, label: "Video Feeds", value: "231 Live" },
  { icon: HardDrive, label: "Storage", value: "78.6 TB / 100 TB" },
  { icon: Clock, label: "System Uptime", value: "24d 14h 32m" },
];

export function StatusFooter() {
  return (
    <footer className="flex flex-col gap-2 border-t border-surface-border bg-surface-1 px-4 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="size-3.5" />
            <span>
              {label}: <span className="text-foreground/80">{value}</span>
            </span>
          </div>
        ))}
      </div>
      <div>© 2025 SafeCity AI. All rights reserved.</div>
    </footer>
  );
}
