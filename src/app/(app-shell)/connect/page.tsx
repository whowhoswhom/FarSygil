import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";

import { SyncPanel } from "@/components/connect/sync-panel";
import { db } from "@/db/client";
import { activities, activityRawJson } from "@/db/schema";
import { MetricIconBadge } from "@/components/visual-reboot";
import { getStravaConnectionStatus } from "@/server/strava/oauth";
import { getRecentStravaSyncLogs } from "@/server/strava/sync-logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const [status, syncLogs, latestActivity, activityTotals, detailTotals, streamTotals] =
    await Promise.all([
      getStravaConnectionStatus(db),
      getRecentStravaSyncLogs(db),
      db
        .select({
          name: activities.name,
          startDate: activities.startDate,
        })
        .from(activities)
        .orderBy(desc(activities.startDate))
        .limit(1)
        .then((rows) => rows[0] ?? null),
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(activities)
        .where(eq(activities.source, "strava"))
        .then((rows) => rows[0]?.count ?? 0),
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(activityRawJson)
        .where(eq(activityRawJson.payloadType, "detailed_activity"))
        .then((rows) => rows[0]?.count ?? 0),
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(activityRawJson)
        .where(eq(activityRawJson.payloadType, "streams"))
        .then((rows) => rows[0]?.count ?? 0),
    ]);

  return (
    <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
      <section className="px-1 pt-1">
        <p className="section-kicker mb-3">Connect</p>
        <h1 className="text-[2.9rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
          Connect
        </h1>
      </section>

      <section className="dashboard-shell-card p-6 md:p-7">
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <MetricIconBadge tone="exercise" icon="connect" size="lg" />
              <div className="min-w-0">
                <h2 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-white md:text-[3rem]">
                  Strava connection
                </h2>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
                  OAuth credentials and sync history stay local. Only direct
                  Strava requests leave this machine when you explicitly connect
                  or sync.
                </p>
              </div>
            </div>
            <StatusPill connected={status.connected} expired={status.expired} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ConnectMetric label="Athlete ID" value={status.athleteId ?? "--"} />
            <ConnectMetric label="Scope" value={status.scope ?? "--"} />
            <ConnectMetric
              label="Token expires"
              value={status.connected ? formatExpiry(status.expiresAt) : "--"}
            />
            <ConnectMetric label="Last updated" value={status.updatedAt ?? "--"} />
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/api/strava/connect"
              className="accent-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              {status.connected ? "Reconnect Strava" : "Connect Strava"}
            </a>
            <Link
              href="/runs"
              className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              Open Runs
            </Link>
            <Link
              href="/settings"
              className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              Open Settings
            </Link>
          </div>

          <SyncPanel
            connected={status.connected}
            logs={syncLogs}
            coverage={{
              totalActivities: activityTotals,
              detailActivities: detailTotals,
              streamActivities: streamTotals,
            }}
          />

          <div className="rounded-[22px] border border-white/6 bg-black/10 px-5 py-5">
            <p className="section-kicker mb-2">Local archive</p>
            <p className="text-sm text-[var(--ink-2)]">
              Summary sync builds the archive first. Detail sync backfills split
              rows and stream rows so `/runs/[id]` can render richer local run
              detail without fabricating anything.
            </p>
            {latestActivity ? (
              <p className="mt-3 text-sm text-[var(--ink-3)]">
                Latest archived activity:{" "}
                <span className="text-[var(--ink-1)]">
                  {latestActivity.name ?? "Untitled effort"}
                </span>
                {latestActivity.startDate
                  ? ` | ${new Date(latestActivity.startDate).toLocaleDateString()}`
                  : ""}
              </p>
            ) : (
              <p className="mt-3 text-sm text-[var(--ink-3)]">
                No local activities yet. Connect Strava and run a sync to begin.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusPill({
  connected,
  expired,
}: {
  connected: boolean;
  expired: boolean;
}) {
  if (!connected) {
    return (
      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--ink-2)]">
        Disconnected
      </span>
    );
  }

  if (expired) {
    return (
      <span className="rounded-full border border-[var(--danger-soft)] bg-[rgba(229,102,74,0.12)] px-3 py-1 text-xs font-medium text-[var(--danger-ink)]">
        Token expired
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[rgba(168,226,108,0.22)] bg-[rgba(123,194,65,0.12)] px-3 py-1 text-xs font-medium text-[var(--accent-bright)]">
      Connected
    </span>
  );
}

function ConnectMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-black/10 px-4 py-4">
      <p className="section-kicker mb-2">{label}</p>
      <p className="text-sm text-[var(--ink-1)]">{value}</p>
    </div>
  );
}

function formatExpiry(expiresAt: number | null): string {
  if (!expiresAt) {
    return "--";
  }

  try {
    return new Date(expiresAt * 1000).toLocaleString();
  } catch {
    return "--";
  }
}
