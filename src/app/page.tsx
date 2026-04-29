import Link from "next/link";

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
    phase: "Phase 1 — Planned",
    description:
      "Connect your Strava account and import run activity data locally.",
  },
  {
    title: "Apple Health Import",
    phase: "Phase 2 — Planned",
    description:
      "Import heart rate, HRV, sleep, and other health metrics from Apple Health exports.",
  },
  {
    title: "Dashboard",
    phase: "Phase 2 — Planned",
    description:
      "View your running history, trends, and health data in one place.",
  },
  {
    title: "Training Analytics",
    phase: "Phase 3 — Planned",
    description:
      "Deterministic training load, fitness, fatigue, and race projections computed from your local data.",
  },
  {
    title: "Grounded AI Chat",
    phase: "Phase 4 — Planned",
    description:
      "Ask questions about your training grounded entirely in your local data. No hallucinations.",
  },
];

export default async function HomePage() {
  const stravaStatus = await getStravaConnectionStatus();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-3">
            FarSygil
          </h1>
          <p className="text-xl text-zinc-400">
            Local-first running command center.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Foundation ready. Features coming in Phase 1+.
          </p>
        </div>

        {/* Strava connection card */}
        <Link
          href="/connect"
          className="block mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-5 hover:border-zinc-700 hover:bg-zinc-900 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Strava</h2>
            <StravaBadge
              connected={stravaStatus.connected}
              expired={stravaStatus.expired}
            />
          </div>
          <p className="text-sm text-zinc-400">
            {stravaStatus.connected
              ? `Athlete ${stravaStatus.athleteId} — manage connection.`
              : "Connect your Strava account to enable activity import."}
          </p>
        </Link>

        {/* Phase cards */}
        <div className="grid gap-4">
          {phases.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border px-6 py-5 transition-colors border-zinc-800 bg-zinc-900/50 opacity-70"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold text-white">
                  {item.title}
                </h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
                  {item.phase}
                </span>
              </div>
              <p className="text-sm text-zinc-400">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-14 text-xs text-zinc-600 text-center">
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
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
        Not connected
      </span>
    );
  }
  if (expired) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-900">
        Token expired
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-900">
      Connected
    </span>
  );
}
