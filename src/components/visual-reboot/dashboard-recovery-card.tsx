import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

export function DashboardRecoveryCard({
  hint,
}: {
  hint: string;
}) {
  return (
    <article className="dashboard-shell-card p-4 md:p-5">
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <MetricIconBadge tone="recovery" icon="recovery" />
          <div>
            <h3 className="text-[1.55rem] font-semibold tracking-[-0.045em] text-white md:text-[1.85rem]">
              Recovery
            </h3>
            <p className="text-sm text-[var(--ink-2)]">Derived readiness</p>
          </div>
        </div>

        <div className="dashboard-mock-empty grid flex-1 gap-4 p-4 md:grid-cols-[130px_minmax(0,1fr)] md:items-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-[rgba(185,112,255,0.38)] bg-[rgba(185,112,255,0.05)] shadow-[0_0_40px_-24px_var(--metric-recovery)] md:h-32 md:w-32">
            <span className="dashboard-tile-value text-center text-[1.05rem] font-semibold leading-tight text-white/80">
              Data not available
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--ink-3)] md:text-sm">{hint}</p>
        </div>
      </div>
    </article>
  );
}
