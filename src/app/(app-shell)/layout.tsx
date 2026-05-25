import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { db } from "@/db/client";
import { getAppleHealthImportSummary } from "@/server/apple-health/queries";
import { getDashboardHeaderSnapshot } from "@/server/dashboard/strava";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AppShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [shellSnapshot, healthSummary] = await Promise.all([
    getDashboardHeaderSnapshot(db),
    getAppleHealthImportSummary(db),
  ]);
  const hasAppleHealthMetrics = healthSummary.metricRows > 0;

  return (
    <AppShell
      stravaLabel={shellSnapshot.statusLabel}
      stravaState={shellSnapshot.statusState}
      healthLabel={
        hasAppleHealthMetrics ? "Apple Health imported" : "Health import pending"
      }
      healthState={hasAppleHealthMetrics ? "connected" : "unavailable"}
      lastSyncedLabel={formatRelativeLastSynced(shellSnapshot.lastSyncedAt)}
      lastSyncedAt={shellSnapshot.lastSyncedAt}
    >
      {children}
    </AppShell>
  );
}

function formatRelativeLastSynced(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const milliseconds = date.getTime() - Date.now();
  const seconds = Math.round(milliseconds / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (Math.abs(seconds) < 60) {
    return formatter.format(seconds, "second");
  }

  const minutes = Math.round(seconds / 60);

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }

  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}
