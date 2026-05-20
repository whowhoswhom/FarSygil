import {
  DashboardRecoveryCard,
  DashboardTrainingLoadCard,
  MetricIconBadge,
} from "@/components/visual-reboot";
import { DailyStressPanel } from "@/components/training-load/daily-stress-panel";
import { db } from "@/db/client";
import { getDailyTrainingStressSnapshot } from "@/server/training-load/daily-stress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TrainingLoadPage() {
  const dailyStress = await getDailyTrainingStressSnapshot(db);

  return (
    <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
      <section className="px-1 pt-1">
        <p className="section-kicker mb-3">Training Load</p>
        <h1 className="text-[2.9rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
          Training Load
        </h1>
      </section>

      <section className="dashboard-shell-card p-6 md:p-7">
        <div className="relative flex items-center gap-4">
          <MetricIconBadge tone="trend" icon="load" size="lg" />
          <div>
            <h2 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
              Derived load scaffold
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              Daily stress can now be computed from real local Strava runs. ATL,
              CTL, TSB, recovery, and related derived surfaces remain empty
              until the next analytics pass.
            </p>
          </div>
        </div>
      </section>

      <DailyStressPanel latest={dailyStress.latest} series={dailyStress.series} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <DashboardTrainingLoadCard
          hint="Data not available until FarSygil computes ATL, CTL, TSB, and related load metrics from daily stress history."
        />
        <DashboardRecoveryCard
          hint="Data not available until recovery can be derived from imported health signals and computed load values."
        />
      </div>
    </main>
  );
}
