import Link from "next/link";
import { redirect } from "next/navigation";

import { AppIcon, AppLogoMark } from "@/components/app-shell";
import { db } from "@/db/client";
import { getStravaConnectionStatus } from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stravaStatus = await getStravaConnectionStatus(db);

  if (stravaStatus.connected) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell fs-view min-h-screen px-4 py-4 text-[var(--ink-1)] md:px-8 md:py-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-[1180px] items-center md:min-h-[calc(100svh-3rem)]">
        <section className="dashboard-shell-card w-full p-4 md:p-6">
          <div className="relative grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="flex flex-col justify-between gap-8 rounded-[28px] border border-white/6 bg-black/10 p-5 md:p-7">
              <div className="flex items-center gap-3">
                <AppLogoMark className="h-8 w-12 flex-none md:h-10 md:w-14" />
                <div>
                  <p className="text-[2.45rem] font-semibold leading-none tracking-[-0.07em] text-white md:text-[4.1rem]">
                    FarSygil
                  </p>
                  <p className="mt-2 text-base text-[var(--ink-2)] md:text-xl">
                    Local-first running command center
                  </p>
                </div>
              </div>

              <div className="max-w-2xl">
                <p className="text-[1.05rem] leading-relaxed text-[var(--ink-2)] md:text-[1.18rem]">
                  Built for one runner to turn local Strava and Apple Health
                  exports into a dense training dashboard.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-3)]">
                  FarSygil only talks to Strava when you connect, sync, or run
                  the local freshness check. No map tiles, no geocoding, no telemetry.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  href="/api/strava/connect"
                  className="accent-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Connect Strava
                </a>
                <Link
                  href="/connect"
                  className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Open Connect
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2">
                <OnboardingMetric label="Runtime" value="Local" tone="exercise" />
                <OnboardingMetric label="Storage" value="SQLite" tone="distance" />
                <OnboardingMetric label="Mode" value="Single" tone="recovery" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <OnboardingCard
                  icon="dashboard"
                  title="Dashboard"
                  body="Connected users enter the dashboard automatically. Disconnected users start here."
                />
                <OnboardingCard
                  icon="runs"
                  title="Runs"
                  body="Run cards, route previews, split rows, and streams render only from local rows."
                />
                <OnboardingCard
                  icon="health"
                  title="Health"
                  body="Apple Health values appear only after a local XML or ZIP import."
                />
                <OnboardingCard
                  icon="load"
                  title="Load"
                  body="Training Load stays empty unless local stress and analytics inputs exist."
                />
              </div>

              <div className="rounded-[24px] border border-white/6 bg-black/10 p-4">
                <p className="section-kicker mb-3">Start flow</p>
                <div className="grid gap-2 md:grid-cols-3">
                  <FlowStep step="01" label="Connect Strava" />
                  <FlowStep step="02" label="Sync local archive" />
                  <FlowStep step="03" label="Open Dashboard" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OnboardingMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "exercise" | "distance" | "recovery";
}) {
  const toneClass =
    tone === "exercise"
      ? "text-[var(--metric-session)]"
      : tone === "distance"
        ? "text-[var(--metric-distance)]"
        : "text-[var(--metric-recovery)]";

  return (
    <div className="rounded-[20px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-2">{label}</p>
      <p className={`dashboard-tile-value text-[1.7rem] font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function OnboardingCard({
  icon,
  title,
  body,
}: {
  icon: "dashboard" | "runs" | "health" | "load";
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-black/10 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/8 bg-white/[0.04] text-[var(--accent-bright)]">
          <AppIcon name={icon} />
        </span>
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">
          {title}
        </h2>
      </div>
      <p className="text-xs leading-relaxed text-[var(--ink-3)]">{body}</p>
    </div>
  );
}

function FlowStep({ step, label }: { step: string; label: string }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-white/[0.02] px-3 py-3">
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[var(--ink-3)]">
        {step}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{label}</p>
    </div>
  );
}
