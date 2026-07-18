import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";

import { SyncPanel } from "@/components/connect/sync-panel";
import { db } from "@/db/client";
import { activities, activityRawJson } from "@/db/schema";
import { MetricIconBadge, PageMasthead } from "@/components/visual-reboot";
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
    <main className="page-shell fs-view flex flex-col gap-8 pb-6 text-[var(--ink-1)]">
      <PageMasthead
        eyebrow="Strava"
        title="Connect"
        sub="OAuth, sync controls, and import provenance for the local Strava archive."
      />

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="dashboard-shell-card p-4 md:p-5">
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <MetricIconBadge tone="exercise" icon="connect" />
                <div className="min-w-0">
                  <p className="section-kicker mb-1">Strava</p>
                  <h2 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white md:text-[2.15rem]">
                    Connection
                  </h2>
                </div>
              </div>
              <StatusPill connected={status.connected} expired={status.expired} />
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
              OAuth credentials and sync history stay local. Only direct Strava
              requests leave this machine after you connect, either from sync
              controls or the local freshness check.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ConnectMetric label="Athlete" value={status.athleteId ?? "--"} />
              <ConnectMetric label="Scope" value={status.scope ?? "--"} />
              <ConnectMetric
                label="Expires"
                value={status.connected ? formatExpiry(status.expiresAt) : "--"}
              />
              <ConnectMetric label="Updated" value={status.updatedAt ?? "--"} />
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
              <a
                href="/api/strava/connect"
                className="accent-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold sm:text-sm"
              >
                {status.connected ? "Reconnect Strava" : "Connect Strava"}
              </a>
              <Link
                href="/runs"
                className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold sm:text-sm"
              >
                Open Runs
              </Link>
              <Link
                href="/settings"
                className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold sm:text-sm"
              >
                Settings
              </Link>
            </div>
          </div>
        </article>

        <article className="dashboard-shell-card p-4 md:p-5">
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-kicker mb-1">Local archive</p>
                <h2 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white md:text-[2.15rem]">
                  Sync coverage
                </h2>
              </div>
              <MetricIconBadge tone="distance" icon="archive" size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <ArchiveMetric label="Runs" value={String(activityTotals)} />
              <ArchiveMetric
                label="Details"
                value={formatCoverage(detailTotals, activityTotals)}
              />
              <ArchiveMetric
                label="Streams"
                value={formatCoverage(streamTotals, activityTotals)}
              />
            </div>

            <div className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-3">
              <p className="section-kicker mb-2">Latest activity</p>
              {latestActivity ? (
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="max-w-[18rem] truncate text-base font-semibold text-white">
                    {latestActivity.name ?? "Untitled effort"}
                  </p>
                  <p className="text-xs text-[var(--ink-3)]">
                    {latestActivity.startDate
                      ? formatShortDate(latestActivity.startDate)
                      : "--"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-3)]">
                  No local activities yet. Connect Strava and run a sync.
                </p>
              )}
            </div>

            <p className="mt-auto text-xs leading-relaxed text-[var(--ink-3)]">
              Summary sync creates archive rows. Detail sync backfills split and
              stream rows for richer local run detail.
            </p>
          </div>
        </article>
      </section>

      <SyncPanel
        connected={status.connected}
        logs={syncLogs}
        coverage={{
          totalActivities: activityTotals,
          detailActivities: detailTotals,
          streamActivities: streamTotals,
        }}
      />
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
      <span className="rounded-full border border-[rgba(168,226,108,0.22)] bg-[rgba(123,194,65,0.12)] px-3 py-1 text-xs font-medium text-[var(--accent-bright)]">
        Auto-refresh ready
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
    <div className="min-w-0 rounded-[18px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-1">{label}</p>
      <p className="truncate text-xs text-[var(--ink-1)] sm:text-sm" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function ArchiveMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-2">{label}</p>
      <p className="dashboard-tile-value text-[1.75rem] font-semibold text-white md:text-[2rem]">
        {value}
      </p>
    </div>
  );
}

function formatCoverage(count: number, total: number): string {
  if (total <= 0) {
    return "--";
  }

  return `${Math.round((count / total) * 100)}%`;
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

function formatShortDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}
