import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { activities } from "@/db/schema";
import { getStravaConnectionStatus } from "@/server/strava/oauth";
import { getRecentStravaSyncLogs } from "@/server/strava/sync-logs";
import { SyncPanel } from "./sync-panel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export default async function ConnectPage() {
  const status = await getStravaConnectionStatus(db);
  const syncLogs = await getRecentStravaSyncLogs(db);
  const [latestActivity] = await db
    .select({
      name: activities.name,
      startDate: activities.startDate,
    })
    .from(activities)
    .orderBy(desc(activities.startDate))
    .limit(1);

  return (
    <main className="page-shell min-h-screen px-4 py-6 text-[var(--ink-1)] md:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm text-[var(--ink-3)] hover:text-[var(--ink-1)]"
        >
          Back
        </Link>

        <section
          className="surface-slab archive-rise rounded-[28px] px-6 py-6 md:px-8 md:py-8"
          data-depth="tile"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Connect</p>
              <h1 className="ink-safe text-[2.5rem] font-semibold tracking-[-0.06em] text-white md:text-[3.2rem]">
                Connect Strava
              </h1>
            </div>
            <StatusBadge connected={status.connected} expired={status.expired} />
          </div>

          <p className="mb-6 max-w-2xl text-[var(--ink-2)]">
            Authorize FarSygil to read your activity data. Tokens are stored
            locally in <code className="text-white">data/running.db</code>.
          </p>

          <dl className="grid gap-3 md:grid-cols-2">
            <StatusCell label="Athlete ID" value={status.athleteId ?? "--"} />
            <StatusCell label="Scope" value={status.scope ?? "--"} />
            <StatusCell
              label="Token expires"
              value={status.connected ? formatExpiry(status.expiresAt) : "--"}
            />
            <StatusCell label="Last updated" value={status.updatedAt ?? "--"} />
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/strava/connect"
              className="accent-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
            >
              {status.connected ? "Reconnect Strava" : "Connect Strava"}
            </a>
            <Link
              href="/activities"
              className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Open Archive
            </Link>
          </div>

          <SyncPanel connected={status.connected} logs={syncLogs} />

          <div className="mt-6 rounded-[22px] border border-white/6 bg-black/10 px-5 py-5">
            <p className="section-kicker mb-2">Local archive</p>
            <p className="text-sm text-[var(--ink-2)]">
              OAuth, summary sync, and the archive are all live. Recent sync
              events stay local in SQLite and surface above.
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
                No local activities yet. Run Sync now after connecting Strava
                to populate the archive.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({
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

function StatusCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-4">
      <p className="section-kicker mb-2">{label}</p>
      <p className="text-sm text-[var(--ink-1)]">{value}</p>
    </div>
  );
}
