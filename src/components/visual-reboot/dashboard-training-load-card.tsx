import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

export function DashboardTrainingLoadCard({
  hint,
}: {
  hint: string;
}) {
  return (
    <article className="dashboard-shell-card p-5 md:p-6">
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-center gap-3">
          <MetricIconBadge tone="trend" icon="load" />
          <div>
            <h3 className="text-[2rem] font-semibold tracking-[-0.045em] text-white">
              Training Load
            </h3>
            <p className="text-base text-[var(--ink-2)]">Derived analytics</p>
          </div>
        </div>

        <div className="dashboard-mock-empty flex flex-1 flex-col justify-between gap-4 p-5">
          <div className="flex items-end gap-2">
            <span className="dashboard-tile-value text-[3rem] font-semibold text-white/82">
              Data not available
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["CTL", "ATL", "TSB"].map((label) => (
              <div key={label} className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-4">
                <p className="section-kicker mb-2">{label}</p>
                <p className="dashboard-tile-value text-[2rem] text-white/78">--</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-[var(--ink-3)]">{hint}</p>
        </div>
      </div>
    </article>
  );
}
