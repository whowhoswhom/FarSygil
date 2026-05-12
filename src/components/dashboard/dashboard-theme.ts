import type { CSSProperties } from "react";

import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";

const DASHBOARD_TONE_TOKENS: Record<
  DashboardMetricTone,
  { tone: string; wash: string }
> = {
  move: {
    tone: "var(--metric-move)",
    wash: "var(--metric-move-wash)",
  },
  exercise: {
    tone: "var(--metric-exercise)",
    wash: "var(--metric-exercise-wash)",
  },
  distance: {
    tone: "var(--metric-distance)",
    wash: "var(--metric-distance-wash)",
  },
  time: {
    tone: "var(--metric-time)",
    wash: "var(--metric-time-wash)",
  },
  trend: {
    tone: "var(--metric-trend)",
    wash: "var(--metric-trend-wash)",
  },
  cardio: {
    tone: "var(--metric-cardio)",
    wash: "var(--metric-cardio-wash)",
  },
  recovery: {
    tone: "var(--metric-recovery)",
    wash: "var(--metric-recovery-wash)",
  },
  warning: {
    tone: "var(--metric-warning)",
    wash: "var(--metric-warning-wash)",
  },
  neutral: {
    tone: "var(--ink-1)",
    wash: "rgba(244, 247, 240, 0.08)",
  },
};

export function dashboardToneVars(
  tone: DashboardMetricTone = "neutral",
): CSSProperties {
  const palette = DASHBOARD_TONE_TOKENS[tone];

  return {
    "--dashboard-tone": palette.tone,
    "--dashboard-tone-wash": palette.wash,
  } as CSSProperties;
}

export function dashboardToneColor(
  tone: DashboardMetricTone = "neutral",
): string {
  return DASHBOARD_TONE_TOKENS[tone].tone;
}
