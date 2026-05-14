import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

export function DashboardRecoveryCard({
  hint,
}: {
  hint: string;
}) {
  return (
    <article className="dashboard-shell-card p-5 md:p-6">
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-center gap-3">
          <MetricIconBadge tone="recovery" icon="recovery" />
          <div>
            <h3 className="text-[2rem] font-semibold tracking-[-0.045em] text-white">
              Recovery
            </h3>
            <p className="text-base text-[var(--ink-2)]">Derived readiness</p>
          </div>
        </div>

        <div className="dashboard-mock-empty flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-white/12 bg-white/[0.02]">
            <span className="dashboard-tile-value text-[2rem] font-semibold text-white/80">
              Data not available
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-[var(--ink-3)]">{hint}</p>
        </div>
      </div>
    </article>
  );
}
