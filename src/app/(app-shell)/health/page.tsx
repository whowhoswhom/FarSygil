import {
  DashboardHealthClusterCard,
  MetricIconBadge,
} from "@/components/visual-reboot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function HealthPage() {
  return (
    <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
      <section className="px-1 pt-1">
        <p className="section-kicker mb-3">Health</p>
        <h1 className="text-[2.9rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
          Health
        </h1>
      </section>

      <section className="dashboard-shell-card p-6 md:p-7">
        <div className="relative flex items-center gap-4">
          <MetricIconBadge tone="recovery" icon="health" size="lg" />
          <div>
            <h2 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
              Apple Health scaffold
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              This route is real and shell-integrated now. It stays honestly
              empty until the Apple Health importer writes real local rows.
            </p>
          </div>
        </div>
      </section>

      <DashboardHealthClusterCard
        title="Health & Wellness"
        sourceLabel="Apple Health"
        metrics={[
          { label: "VO2 Max", tone: "time", icon: "spark" },
          { label: "Resting HR", tone: "cardio", icon: "heartrate" },
          { label: "HRV", tone: "recovery", icon: "spark" },
          { label: "Sleep", tone: "recovery", icon: "recovery" },
          { label: "Steps", tone: "distance", icon: "runs" },
        ]}
        hint="Data not available until the Apple Health importer parses real exports and stores daily metric rows locally."
      />
    </main>
  );
}
