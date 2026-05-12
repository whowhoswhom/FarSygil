import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard · FarSygil",
  description:
    "Local-first running command center. Apple Fitness-inspired dashboard, implemented in phased PRs.",
};

const placeholders: Array<{
  title: string;
  unlockedBy: string;
}> = [
  {
    title: "Running",
    unlockedBy:
      "Appears after Strava sync runs and the metric components from PR B / PR C land.",
  },
  {
    title: "Health",
    unlockedBy:
      "Appears after the Apple Health importer is implemented (PR E).",
  },
  {
    title: "Training load",
    unlockedBy:
      "Appears after the training-load analytics module is implemented (PR F).",
  },
];

export default function DashboardPage() {
  return (
    <main className="page-shell mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10 lg:px-14">
      <header className="flex flex-col gap-3">
        <span className="section-kicker">Dashboard</span>
        <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--ink-1)] sm:text-5xl">
          FarSygil
        </h1>
        <p className="max-w-xl text-base text-[color:var(--ink-2)]">
          Local-first running command center. The full dashboard is being built
          in phased PRs. See{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm text-[color:var(--ink-1)]">
            docs/brain/16_DASHBOARD-IMPLEMENTATION-PLAN.md
          </code>{" "}
          for the design and rollout plan.
        </p>
      </header>

      <section
        aria-label="Dashboard sections - empty placeholders"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {placeholders.map((placeholder) => (
          <article
            key={placeholder.title}
            className="surface-slab flex min-h-[200px] flex-col justify-between gap-6 rounded-3xl p-7"
          >
            <div className="flex flex-col gap-2">
              <span className="section-kicker">{placeholder.title}</span>
              <p className="text-xl font-semibold text-[color:var(--ink-1)]">
                Data not available.
              </p>
            </div>
            <p className="text-sm leading-relaxed text-[color:var(--ink-2)]">
              {placeholder.unlockedBy}
            </p>
          </article>
        ))}
      </section>

      <footer className="flex flex-col gap-2 text-sm text-[color:var(--ink-3)]">
        <p>
          No metrics, charts, or fake numbers are rendered here yet. Cards
          appear as their data sources land in SQLite.
        </p>
        <p>
          Strava status and sync controls live on{" "}
          <Link
            href="/connect"
            className="underline decoration-dotted underline-offset-4 hover:text-[color:var(--ink-1)]"
          >
            /connect
          </Link>
          . Synced runs are browsable on{" "}
          <Link
            href="/activities"
            className="underline decoration-dotted underline-offset-4 hover:text-[color:var(--ink-1)]"
          >
            /activities
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
