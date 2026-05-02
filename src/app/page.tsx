import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/db/client";
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

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14">
          <h1 className="mb-3 text-5xl font-bold tracking-tight text-white">
            FarSygil
          </h1>
          <p className="text-xl text-zinc-400">
            Local-first running command center.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Phase 1 is live in slices. Start with Strava OAuth, then land
            activity sync.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/api/strava/connect"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
            >
              Connect Strava
            </a>
            <p className="text-sm text-zinc-500">
              Opens Strava OAuth and stores the returned token locally in
              SQLite.
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <StravaStatusBanner />
        </Suspense>

        <Link
          href="/connect"
          className="mb-8 block rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
        >
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Strava</h2>
            <StravaBadge
              connected={stravaStatus.connected}
              expired={stravaStatus.expired}
            />
          </div>
          <p className="text-sm text-zinc-400">
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
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-5 opacity-70 transition-colors"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {item.title}
                </h2>
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">
                  {item.phase}
                </span>
              </div>
              <p className="text-sm text-zinc-400">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-center text-xs text-zinc-600">
          All data is stored locally. Nothing leaves your machine.
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
      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
        Not connected
      </span>
    );
  }

  if (expired) {
    return (
      <span className="rounded-full border border-amber-900 bg-amber-950/60 px-2 py-0.5 text-xs font-medium text-amber-300">
        Token expired
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-900 bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-300">
      Connected
    </span>
  );
}
