"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

export function MiniTrendChart({
  data,
  color = "#3b82f6",
  variant = "line",
  height = 90,
  showAxis = false,
  showGrid = false,
}: {
  data: TrendPoint[];
  color?: string;
  variant?: "line" | "area";
  height?: number;
  showAxis?: boolean;
  showGrid?: boolean;
}) {
  const gradientId = `trend-gradient-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      {variant === "area" ? (
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1f2a40" vertical={false} />}
          {showAxis && (
            <>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8b95a8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8b95a8" }} axisLine={false} tickLine={false} width={28} />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: "#0f1626",
              border: "1px solid #1f2a40",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1f2a40" vertical={false} />}
          {showAxis && (
            <>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8b95a8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8b95a8" }} axisLine={false} tickLine={false} width={28} />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: "#0f1626",
              border: "1px solid #1f2a40",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
