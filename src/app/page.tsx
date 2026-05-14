import Link from "next/link";
import { redirect } from "next/navigation";

import { AppLogoMark } from "@/components/app-shell";
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
    <main className="page-shell min-h-screen px-4 py-6 text-[var(--ink-1)] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1480px]">
        <section className="dashboard-shell-card min-h-[76svh] p-6 md:p-10">
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div className="flex items-center gap-4">
              <AppLogoMark className="h-10 w-14 flex-none" />
              <div>
                <p className="text-[3rem] font-semibold tracking-[-0.07em] text-white md:text-[4.6rem]">
                  FarSygil
                </p>
                <p className="mt-2 text-lg text-[var(--ink-2)] md:text-2xl">
                  Local-first running command center
                </p>
              </div>
            </div>

            <div className="max-w-4xl">
              <p className="text-[1.1rem] leading-relaxed text-[var(--ink-2)] md:text-[1.25rem]">
                Built for a single runner, stored locally in SQLite, and honest
                about which surfaces are already powered by real data versus
                which still wait on a provider import or a later analytics pass.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

            <div className="grid gap-4 md:grid-cols-3">
              <OnboardingCard
                title="Dashboard"
                body="Weekly running metrics render from real local Strava archive rows. Health and training-load surfaces stay honest empty states until their data systems exist."
              />
              <OnboardingCard
                title="Runs"
                body="Run detail pages support faux-map route previews, split views, and stream-backed chart tiles when those local detail rows truly exist."
              />
              <OnboardingCard
                title="Local-first"
                body="FarSygil only talks to Strava when you explicitly connect or sync your own account. No map tiles, no geocoding, no telemetry."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OnboardingCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-black/10 px-5 py-5">
      <h2 className="text-[1.4rem] font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{body}</p>
    </div>
  );
}
