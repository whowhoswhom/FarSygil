import Link from "next/link";
import { Suspense } from "react";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { activities } from "@/db/schema";
import { StravaStatusBanner } from "@/components/strava-status-banner";
import { getStravaConnectionStatus } from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const phases: {
  title: string;
  phase: string;
  description: string;
}[] = [
  {
    title: "Strava Sync",
    phase: "Phase 1 - In progress",
    description:
      "Connect your Strava account now; token storage is ready and activity sync is next.",
  },
  {
    title: "Apple Health Import",
    phase: "Phase 2 - Planned",
    description:
      "Import heart rate, HRV, sleep, and other health metrics from Apple Health exports.",
  },
  {
    title: "Dashboard",
    phase: "Phase 2 - Planned",
    description:
      "View your running history, trends, and health data in one place.",
  },
  {
    title: "Training Analytics",
    phase: "Phase 3 - Planned",
    description:
      "Deterministic training load, fitness, fatigue, and race projections computed from your local data.",
  },
  {
    title: "Grounded AI Chat",
    phase: "Phase 4 - Planned",
    description:
      "Ask questions about your training grounded entirely in your local data. No hallucinations.",
  },
];

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
    <main className="page-shell min-h-screen px-6 py-14 text-[var(--ink-1)] md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="archive-rise mb-12 rounded-[30px] border border-white/8 bg-white/[0.03] px-6 py-8 backdrop-blur-md md:px-10 md:py-10">
          <p className="section-kicker mb-4">FarSygil</p>
          <h1 className="mb-3 text-5xl font-bold tracking-tight text-white md:text-7xl">
            FarSygil
          </h1>
          <p className="max-w-2xl text-xl text-[var(--ink-2)] md:text-2xl">
            Local-first running command center.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-[var(--ink-3)] md:text-base">
            The site now leans into a darker green-led archive system. Start
            with Strava OAuth, then move into your local activity archive.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="/api/strava/connect"
              className="accent-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              Connect Strava
            </a>
            <Link
              href="/activities"
              className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              Open Archive
            </Link>
            <p className="text-sm text-zinc-500">
              Opens Strava OAuth and stores the returned token locally in
              SQLite.
            </p>
          </div>
          {latestActivity ? (
            <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-white/6 bg-black/10 px-5 py-5">
                <p className="section-kicker mb-2">Latest archived effort</p>
                <p className="text-2xl font-semibold tracking-[-0.05em] text-white">
                  {latestActivity.name ?? "Untitled effort"}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-2)]">
                  {latestActivity.sportType ?? "Other"} ·{" "}
                  {latestActivity.startDate
                    ? new Date(latestActivity.startDate).toLocaleDateString()
                    : "Undated"}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/6 bg-black/10 px-5 py-5">
                <p className="section-kicker mb-2">Archive status</p>
                <p className="tabular-nums text-4xl font-semibold tracking-[-0.06em] text-white">
                  {activityCount ? "Live" : "Empty"}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-2)]">
                  {activityCount
                    ? "Activities are present locally and can be browsed in the Archive."
                    : "Connect Strava and sync activities to populate the Archive."}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <Suspense fallback={null}>
          <StravaStatusBanner />
        </Suspense>

        <Link
          href="/connect"
          className="mb-8 block rounded-[24px] border border-white/8 bg-white/[0.03] px-6 py-5 backdrop-blur-md transition-colors hover:border-white/12 hover:bg-white/[0.04]"
        >
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Strava</h2>
            <StravaBadge
              connected={stravaStatus.connected}
              expired={stravaStatus.expired}
            />
          </div>
          <p className="text-sm text-[var(--ink-2)]">
            {stravaStatus.connected
              ? stravaStatus.expired
                ? `Athlete ${stravaStatus.athleteId}. Token is stored locally and currently expired.`
                : `Athlete ${stravaStatus.athleteId}. Token is stored locally in SQLite and ready for activity sync.`
              : "Connect your Strava account to enable activity import."}
          </p>
        </Link>

        <div className="grid gap-4">
          {phases.map((item) => (
            <div
              key={item.title}
              className="rounded-[22px] border border-white/6 bg-black/10 px-6 py-5 opacity-80 backdrop-blur-sm transition-colors"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {item.title}
                </h2>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-xs font-medium text-[var(--ink-3)]">
                  {item.phase}
                </span>
              </div>
              <p className="text-sm text-[var(--ink-2)]">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-center text-xs text-[var(--ink-3)]">
          Data is stored locally. FarSygil only talks to Strava when you
          connect or sync your own account.
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
      <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-xs font-medium text-[var(--ink-2)]">
        Not connected
      </span>
    );
  }

  if (expired) {
    return (
      <span className="rounded-full border border-[var(--danger-soft)] bg-[rgba(229,102,74,0.12)] px-2 py-0.5 text-xs font-medium text-[var(--danger-ink)]">
        Token expired
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[rgba(168,226,108,0.22)] bg-[rgba(123,194,65,0.12)] px-2 py-0.5 text-xs font-medium text-[var(--accent-bright)]">
      Connected
    </span>
  );
}
