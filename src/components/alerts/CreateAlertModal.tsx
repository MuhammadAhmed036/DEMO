"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Save } from "lucide-react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionDrawCanvas } from "@/components/alerts/RegionDrawCanvas";
import { useUIStore } from "@/lib/store/useUIStore";
import { useCameraLocations, useCameraSnapshot } from "@/lib/hooks/useCameraLocations";
import { useCreateAlertRule } from "@/lib/hooks/useAlertRules";
import { liveEventImageUrl } from "@/lib/hooks/useCameraLiveFeed";
import type { AlertBoundingBox, AlertCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type TriggerMode = "enter" | "leave";

const CATEGORY_OPTIONS: { value: AlertCategory; label: string; activeClass: string }[] = [
  {
    value: "critical",
    label: "Critical",
    activeClass: "border-severity-critical bg-severity-critical/15 text-severity-critical",
  },
  {
    value: "medium",
    label: "Medium",
    activeClass: "border-severity-medium bg-severity-medium/15 text-severity-medium",
  },
  {
    value: "low",
    label: "Low",
    activeClass: "border-severity-low bg-severity-low/15 text-severity-low",
  },
];

export function CreateAlertModal() {
  const isOpen = useUIStore((s) => s.isCreateAlertModalOpen);
  const setOpen = useUIStore((s) => s.setCreateAlertModalOpen);
  const prefilledCameraId = useUIStore((s) => s.selectedCameraId);

  const { data: cameras } = useCameraLocations();
  const createRule = useCreateAlertRule();

  const [cameraId, setCameraId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AlertCategory | "">("");
  const [triggerMode, setTriggerMode] = useState<TriggerMode>("enter");
  const [box, setBox] = useState<AlertBoundingBox | null>(null);

  const { data: snapshot, isLoading: snapshotLoading, error: snapshotError } = useCameraSnapshot(
    cameraId || null
  );

  useEffect(() => {
    if (isOpen && prefilledCameraId && !cameraId && cameras) {
      const match = cameras.find(
        (c) => c.cameraId.toLowerCase() === prefilledCameraId.toLowerCase()
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-fills the form only when the dialog opens from a camera context.
      if (match) setCameraId(match.cameraId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prefilledCameraId, cameras]);

  const selectedCamera = cameras?.find((c) => c.cameraId === cameraId) ?? null;
  const canSave = Boolean(cameraId && name.trim() && category && box && snapshot);

  function resetForm() {
    setCameraId("");
    setName("");
    setCategory("");
    setTriggerMode("enter");
    setBox(null);
  }

  async function handleSave() {
    if (!snapshot || !box || !category) return;
    await createRule.mutateAsync({
      cameraId,
      zone: selectedCamera?.zone ?? undefined,
      name: name.trim(),
      label: "person",
      category,
      sourceEventId: snapshot.eventId,
      boundingBox: box,
      triggerInside: triggerMode === "enter",
      triggerOutside: triggerMode === "leave",
      refImageWidth: snapshot.imageWidth,
      refImageHeight: snapshot.imageHeight,
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
              <DialogTitle>Create Region Alert</DialogTitle>
              <DialogDescription>
                Draw a zone on the camera&apos;s latest snapshot — an alert fires when a
                person&apos;s bounding box matches your trigger condition.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Camera</Label>
          <Select
            value={cameraId}
            onValueChange={(value) => {
              setCameraId(value);
              setBox(null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a camera" />
            </SelectTrigger>
            <SelectContent>
              {cameras?.map((camera) => (
                <SelectItem key={camera.cameraId} value={camera.cameraId}>
                  {camera.cameraName} {camera.zone ? `· ${camera.zone}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {cameraId && (
          <div className="space-y-1.5">
            <Label>Draw Alert Zone</Label>
            {snapshotLoading && <Skeleton className="aspect-video w-full rounded-lg" />}
            {snapshotError && (
              <p className="text-xs text-destructive">
                Could not load a snapshot for this camera yet — it may not have any recorded
                events.
              </p>
            )}
            {snapshot && (
              <RegionDrawCanvas
                imageUrl={liveEventImageUrl(snapshot.eventId)}
                imageWidth={snapshot.imageWidth}
                imageHeight={snapshot.imageHeight}
                value={box}
                onChange={setBox}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Click and drag on the image to draw the zone. Draw again to redo it.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="alert-name">Alert Name</Label>
            <Input
              id="alert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Restricted Zone — Entrance"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Trigger When</Label>
            <Select value={triggerMode} onValueChange={(v) => setTriggerMode(v as TriggerMode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enter">Person enters this zone</SelectItem>
                <SelectItem value="leave">Person is outside this zone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>
            Alert Category <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  category === option.value
                    ? option.activeClass
                    : "border-surface-border text-muted-foreground hover:bg-surface-3"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Required — choose how severe this alert is.</p>
        </div>

        <p className="rounded-lg border border-surface-border bg-surface-2 p-3 text-xs text-muted-foreground">
          This rule is saved to the detection backend and continuously checked by this dashboard
          while it&apos;s open in a browser (via the camera&apos;s live feed). For guaranteed
          always-on detection even when no browser is open, this same check should also be
          implemented in the C++/NATS detection worker.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || createRule.isPending}
            className="gap-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
          >
            {createRule.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Alert Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
