"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Loader2, Mail, MessageSquare, Save, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RulePreview } from "@/components/alerts/RulePreview";
import { useUIStore } from "@/lib/store/useUIStore";
import { useZones } from "@/lib/hooks/useZones";
import { useCameras } from "@/lib/hooks/useCameras";
import { useCreateAlertRule } from "@/lib/hooks/useAlerts";
import type { AlertSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALERT_TYPES = [
  "Crowd Analysis",
  "Loitering Detection",
  "Line Crossing",
  "Vehicle Detection",
  "Intrusion Detection",
  "Face Recognition",
  "Object Detection",
  "Tampering Detection",
];

const CONDITION_FIELDS = ["Person Count", "Density Percentage", "Duration", "Vehicle Count", "Confidence Score"];

const CONDITION_OPERATORS: { value: string; label: string; sentence: string }[] = [
  { value: "gt", label: "Greater Than (>)", sentence: "is greater than" },
  { value: "lt", label: "Less Than (<)", sentence: "is less than" },
  { value: "eq", label: "Equal To (=)", sentence: "is equal to" },
  { value: "gte", label: "Greater Than or Equal (>=)", sentence: "is at least" },
];

const SEVERITIES: AlertSeverity[] = ["critical", "high", "medium", "low"];

const NOTIFICATION_METHODS: { id: "email" | "sms" | "in_app" | "push"; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "in_app", label: "In-App", icon: Bell },
  { id: "push", label: "Push", icon: Smartphone },
];

export function CreateAlertModal() {
  const isOpen = useUIStore((s) => s.isCreateAlertModalOpen);
  const setOpen = useUIStore((s) => s.setCreateAlertModalOpen);
  const prefilledCameraId = useUIStore((s) => s.selectedCameraId);

  const { data: zones } = useZones();
  const { data: cameras } = useCameras();
  const createRule = useCreateAlertRule();

  const [name, setName] = useState("");
  const [target, setTarget] = useState<string>("");
  const [alertType, setAlertType] = useState(ALERT_TYPES[0]);
  const [field, setField] = useState(CONDITION_FIELDS[0]);
  const [operator, setOperator] = useState(CONDITION_OPERATORS[0].value);
  const [threshold, setThreshold] = useState(50);
  const [duration, setDuration] = useState(5);
  const [durationUnit, setDurationUnit] = useState<"Minutes" | "Hours">("Minutes");
  const [severity, setSeverity] = useState<AlertSeverity>("high");
  const [methods, setMethods] = useState<string[]>(["email", "in_app"]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (isOpen && prefilledCameraId && !target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-fills the form only when the dialog opens from a camera context.
      setTarget(`camera:${prefilledCameraId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const targetLabel = useMemo(() => {
    if (!target) return "Select a camera or zone";
    if (target.startsWith("zone:")) {
      return zones?.find((z) => z.id === target.replace("zone:", ""))?.name ?? "Zone";
    }
    return cameras?.find((c) => c.id === target.replace("camera:", ""))?.name ?? "Camera";
  }, [target, zones, cameras]);

  const operatorMeta = CONDITION_OPERATORS.find((o) => o.value === operator) ?? CONDITION_OPERATORS[0];

  function toggleMethod(id: string) {
    setMethods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function resetForm() {
    setName("");
    setTarget("");
    setAlertType(ALERT_TYPES[0]);
    setField(CONDITION_FIELDS[0]);
    setOperator(CONDITION_OPERATORS[0].value);
    setThreshold(50);
    setDuration(5);
    setDurationUnit("Minutes");
    setSeverity("high");
    setMethods(["email", "in_app"]);
    setEnabled(true);
  }

  async function handleSave() {
    await createRule.mutateAsync({
      name: name || `${field} ${operatorMeta.sentence} ${threshold}`,
      cameraOrZone: target,
      alertType,
      condition: `${field} ${operator} ${threshold}`,
      threshold,
      duration,
      durationUnit,
      severity,
      notificationMethods: methods,
      enabled,
    });
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="max-h-[88vh] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Bell className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle>Create Custom Alert</DialogTitle>
              <DialogDescription>Define conditions to be notified when an event occurs</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="alert-name">Alert Name</Label>
            <Input
              id="alert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High Crowd Density - Blue Area"
            />
            <p className="text-xs text-muted-foreground">Give your alert a clear and descriptive name</p>
          </div>

          <div className="space-y-1.5">
            <Label>Select Camera or Zone</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a camera or zone" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Zones</SelectLabel>
                  {zones?.map((z) => (
                    <SelectItem key={z.id} value={`zone:${z.id}`}>{z.name}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Cameras</SelectLabel>
                  {cameras?.slice(0, 60).map((c) => (
                    <SelectItem key={c.id} value={`camera:${c.id}`}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose a camera or zone to monitor</p>
          </div>

          <div className="space-y-1.5">
            <Label>Alert Type</Label>
            <Select value={alertType} onValueChange={setAlertType}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALERT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select the type of event to monitor</p>
          </div>

          <div className="space-y-1.5">
            <Label>Condition</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={field} onValueChange={setField}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_FIELDS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Choose the condition that will trigger this alert</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="threshold">Threshold</Label>
            <Input
              id="threshold"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Set the numeric threshold</p>
          </div>

          <div className="space-y-1.5">
            <Label>Duration</Label>
            <div className="grid grid-cols-[1fr_1.2fr] gap-2">
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as "Minutes" | "Hours")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Minutes">Minutes</SelectItem>
                  <SelectItem value="Hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Condition must persist for this duration</p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Severity</Label>
            <div className="flex flex-wrap gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    severity === s
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-surface-border text-muted-foreground hover:bg-surface-3"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Define the severity level</p>
          </div>
        </div>

        <RulePreview
          fieldLabel={field}
          operatorLabel={operatorMeta.sentence}
          threshold={threshold}
          duration={duration}
          durationUnit={durationUnit}
          targetLabel={targetLabel}
          severity={severity}
        />

        <div className="space-y-1.5">
          <Label>Notification Method</Label>
          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_METHODS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleMethod(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  methods.includes(id)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-surface-border text-muted-foreground hover:bg-surface-3"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Select how you want to be notified</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-2 px-3 py-2.5">
          <div>
            <div className="text-sm font-medium">Enable Alert</div>
            <p className="text-xs text-muted-foreground">
              Alert is active and will trigger when conditions are met
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={createRule.isPending || !name}
            className="gap-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
          >
            {createRule.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
