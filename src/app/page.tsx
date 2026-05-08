import Link from "next/link";
import { Suspense } from "react";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { activities } from "@/db/schema";
import { StravaStatusBanner } from "@/components/strava-status-banner";
import {
  formatActivityDate,
  formatArchiveCount,
  sportLabel,
} from "@/lib/activities/format";
import { getStravaConnectionStatus } from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stravaStatus = await getStravaConnectionStatus(db);
  const [latestActivity] = await db
    .select({
      name: activities.name,
      sportType: activities.sportType,
      startDate: activities.startDate,
    })
    .from(activities)
    .orderBy(desc(activities.startDate))
    .limit(1);
  const [{ activityCount }] = await db
    .select({
      activityCount: sql<number>`count(*)`,
    })
    .from(activities)
    .limit(1);

  return (
    <main className="page-shell min-h-screen px-4 py-6 text-[var(--ink-1)] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1480px]">
        <Suspense fallback={null}>
          <StravaStatusBanner />
        </Suspense>

        <section
          className="surface-slab archive-rise mb-8 min-h-[72svh] rounded-[34px] px-6 py-6 md:px-10 md:py-10"
          data-depth="hero"
        >
          <div className="flex h-full flex-col justify-between gap-10">
            <div>
              <p className="section-kicker mb-4">FarSygil</p>
            </div>

            <div className="max-w-4xl">
              <h1 className="ink-safe text-5xl font-semibold tracking-[-0.07em] text-white md:text-[5rem]">
                FarSygil
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-[var(--ink-2)] md:text-2xl">
                A private archive of your real running.
              </p>
              <p className="mt-3 max-w-2xl text-sm text-[var(--ink-3)] md:text-base">
                Local-first, single-user, and grounded in the activities already
                stored on this machine.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="/api/strava/connect"
                  className="accent-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                >
                  {stravaStatus.connected ? "Reconnect Strava" : "Connect Strava"}
                </a>
                <Link
                  href="/activities"
                  className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Open Archive
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Link
          href="/connect"
          className="surface-slab mb-12 block rounded-[28px] px-6 py-6 md:px-7"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Connection</p>
              <h2 className="ink-safe text-[2rem] font-semibold tracking-[-0.05em] text-white">
                Strava
              </h2>
            </div>
            <StravaBadge
              connected={stravaStatus.connected}
              expired={stravaStatus.expired}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-white/6 bg-black/10 px-5 py-5">
              <p className="text-sm text-[var(--ink-2)]">
                {stravaStatus.connected
                  ? stravaStatus.expired
                    ? `Athlete ${stravaStatus.athleteId}. Token is stored locally and currently expired.`
                    : `Athlete ${stravaStatus.athleteId}. Token is stored locally in SQLite and ready for the next sync.`
                  : "Authorize FarSygil to read your activity data. Tokens are stored locally in data/running.db."}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/6 bg-black/10 px-5 py-5">
              <p className="section-kicker mb-2">Local archive</p>
              <p className="ink-safe tabular-nums text-3xl font-semibold tracking-[-0.06em] text-white">
                {activityCount > 0 ? formatArchiveCount(activityCount) : "No efforts yet"}
              </p>
              {latestActivity ? (
                <p className="mt-2 text-sm text-[var(--ink-2)]">
                  {latestActivity.name ?? "Untitled effort"} ·{" "}
                  {sportLabel(latestActivity.sportType)} ·{" "}
                  {formatActivityDate(latestActivity.startDate)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--ink-2)]">
                  Connect Strava and sync activities to start the archive.
                </p>
              )}
            </div>
          </div>
        </Link>

        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
          Stored locally · synced from Strava
        </p>
      </div>
    </main>
  );
}

function StravaBadge({
  connected,
  expired,
}: {
  connected: boolean;
  expired: boolean;
}) {
  if (!connected) {
    return (
      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--ink-2)]">
        Not connected
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
