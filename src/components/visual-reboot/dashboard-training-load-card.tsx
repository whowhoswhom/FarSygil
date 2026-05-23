import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

export function DashboardTrainingLoadCard({
  hint,
}: {
  hint: string;
}) {
  return (
    <article className="dashboard-shell-card p-4 md:p-5">
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <MetricIconBadge tone="trend" icon="load" />
          <div>
            <h3 className="text-[1.55rem] font-semibold tracking-[-0.045em] text-white md:text-[1.85rem]">
              Training Load
            </h3>
            <p className="text-sm text-[var(--ink-2)]">Derived analytics</p>
          </div>
        </div>

        <div className="dashboard-mock-empty flex flex-1 flex-col justify-between gap-3 p-4">
          <div>
            <p className="section-kicker mb-2">Status</p>
            <span className="text-[1.55rem] font-semibold leading-tight tracking-[-0.045em] text-white/82 md:text-[1.8rem]">
              Data not available
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["CTL", "ATL", "TSB"].map((label) => (
              <div key={label} className="rounded-[14px] border border-white/6 bg-black/10 px-3 py-3">
                <p className="section-kicker mb-1">{label}</p>
                <p className="dashboard-tile-value text-[1.45rem] text-white/78">--</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-[var(--ink-3)] md:text-sm">{hint}</p>
        </div>
      </div>
    </article>
  );
}
