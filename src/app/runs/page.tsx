import Link from "next/link";
import type { Metadata } from "next";

import { HeroTile } from "@/components/activities/hero-tile";
import { ActivitySessionCard } from "@/components/runs/activity-session-card";
import { db } from "@/db/client";
import { getArchivedRuns } from "@/server/runs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Runs | FarSygil",
  description:
    "Run-first local archive with real route previews and detail pages backed by local Strava data.",
};

export default async function RunsPage() {
  const runs = await getArchivedRuns(db);
  const featuredRun = runs[0] ?? null;
  const remainingRuns = featuredRun ? runs.slice(1) : [];

  if (!featuredRun) {
    return (
      <main className="page-shell min-h-screen px-4 pb-20 pt-8 text-[var(--ink-1)] md:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[30px] border border-white/8 bg-white/[0.03] px-8 py-14 text-center backdrop-blur-md">
          <p className="section-kicker mb-4">Runs</p>
          <h1 className="mb-4 text-5xl font-semibold tracking-[-0.06em] text-white">
            No runs have been archived yet.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-[var(--ink-2)]">
            Connect Strava, run a local sync, and FarSygil will start turning
            your real running history into a dedicated run-first archive.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/connect"
              className="accent-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              Open Connect
            </Link>
            <Link
              href="/dashboard"
              className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen px-4 pb-20 pt-6 text-[var(--ink-1)] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1480px]">
        <section className="surface-slab mb-8 rounded-[28px] px-6 py-6 md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker mb-3">Runs</p>
              <h1 className="ink-safe text-[3rem] font-semibold tracking-[-0.07em] text-white md:text-[4.4rem]">
                Run-first archive.
              </h1>
              <p className="mt-4 text-base text-[var(--ink-2)] md:text-lg">
                Browse your real local running history one session at a time.
                Every card links to a dedicated detail page with map, splits,
                and heart-rate views when those rows exist in SQLite.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/dashboard"
                className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open Dashboard
              </Link>
              <Link
                href="/connect"
                className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                Manage Sync
              </Link>
            </div>
          </div>
        </section>

        <Link href={`/runs/${featuredRun.id}`} className="block">
          <HeroTile activity={featuredRun} />
        </Link>

        <section className="mb-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Archive</p>
              <h2 className="ink-safe text-[2rem] font-semibold tracking-[-0.05em] text-white">
                All runs
              </h2>
            </div>
            <p className="text-sm text-[var(--ink-3)]">
              {runs.length} {runs.length === 1 ? "run" : "runs"} stored locally
            </p>
          </div>

          <div className="grid gap-5">
            {remainingRuns.map((run) => (
              <ActivitySessionCard key={run.id} activity={run} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

