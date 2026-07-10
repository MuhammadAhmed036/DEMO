"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = searchParams.get("from") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Invalid username or password");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setSubmitting(false);
        return;
      }

      router.replace(destination);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface-0 px-4">
      {/* Animated grid backdrop */}
      <div
        className="login-animated absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--surface-border), transparent 40%) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--surface-border), transparent 40%) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          animation: "login-grid-pan 10s linear infinite",
        }}
      />

      {/* Radar sweep */}
      <div
        className="login-animated pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.18]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklch, var(--primary), transparent 30%) 12deg, transparent 60deg)",
          borderRadius: "9999px",
          animation: "login-radar-spin 7s linear infinite",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface-border/60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface-border/40" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface-border/30" />

      {/* Drifting glow orbs */}
      <div
        className="login-animated pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-accent-blue/25 blur-3xl"
        style={{ animation: "login-orb-drift 9s ease-in-out infinite" }}
      />
      <div
        className="login-animated pointer-events-none absolute -bottom-32 -right-16 size-[28rem] rounded-full bg-accent-purple/20 blur-3xl"
        style={{ animation: "login-orb-drift 11s ease-in-out infinite reverse" }}
      />

      {/* Scanline sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="login-animated h-40 w-full bg-gradient-to-b from-transparent via-primary/10 to-transparent"
          style={{ animation: "login-scanline 5s linear infinite" }}
        />
      </div>

      {/* Card */}
      <div
        className={cn(
          "login-animated relative w-full max-w-sm rounded-3xl border border-surface-border bg-surface-2/70 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10",
          shake && "login-animated"
        )}
        style={{
          animation: shake
            ? "login-shake 0.5s ease-in-out"
            : "login-card-in 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <div
            className="login-animated mb-4 flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"
            style={{ animation: "login-badge-pulse 2.4s ease-in-out infinite" }}
          >
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Intellivision Command Center
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Secure Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs text-muted-foreground">
              Username
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="h-11 rounded-xl pl-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl pl-9 pr-9 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Verifying...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Authorized personnel only · All access is monitored
        </p>
      </div>
    </div>
  );
}
