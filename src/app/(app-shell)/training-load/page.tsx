import {
  DashboardRecoveryCard,
  DashboardTrainingLoadCard,
  MetricIconBadge,
  PageMasthead,
} from "@/components/visual-reboot";
import { DailyStressPanel } from "@/components/training-load/daily-stress-panel";
import { db } from "@/db/client";
import { getDailyTrainingStressSnapshot } from "@/server/training-load/daily-stress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TrainingLoadPage() {
  const dailyStress = await getDailyTrainingStressSnapshot(db);

  return (
    <main className="page-shell fs-view flex flex-col gap-8 pb-5 text-[var(--ink-1)]">
      <PageMasthead
        eyebrow="Derived"
        title="Training Load"
        sub="Daily stress is real local input. ATL, CTL, TSB, recovery, and readiness stay empty until analytics compute them from that history."
        actions={
          <div className="dashboard-shell-card w-full p-4 sm:w-80">
            <div className="mb-3 flex items-center gap-3">
              <MetricIconBadge tone="trend" icon="load" />
              <div>
                <p className="fs-eyebrow mb-1">Local input</p>
                <p className="text-sm text-[var(--ink-2)]">Daily stress history</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <LoadStatusCell
                label="Latest stress"
                value={
                  dailyStress.latest
                    ? formatStress(dailyStress.latest.dailyTrainingStress)
                    : "--"
                }
              />
              <LoadStatusCell
                label="Computed days"
                value={String(dailyStress.series.length)}
              />
            </div>
          </div>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <DailyStressPanel latest={dailyStress.latest} series={dailyStress.series} />

        <div className="grid gap-4">
          <DashboardTrainingLoadCard
            title="Load Status"
            hint="Data not available until FarSygil computes ATL, CTL, TSB, and related load metrics from daily stress history."
          />
          <DashboardRecoveryCard
            hint="Data not available until recovery can be derived from imported health signals and computed load values."
          />
        </div>
      </div>
    </main>
  );
}

function LoadStatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-1">{label}</p>
      <p className="dashboard-tile-value text-[1.6rem] font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function formatStress(value: number): string {
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}
