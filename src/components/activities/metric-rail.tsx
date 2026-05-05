import type { ArchiveMetric } from "@/lib/activities/types";

export function MetricRail({
  metrics,
  columns = 4,
}: {
  metrics: ArchiveMetric[];
  columns?: 3 | 4;
}) {
  return (
    <div
      className={`grid gap-4 ${columns === 3 ? "md:grid-cols-3" : "md:grid-cols-4"}`}
    >
      {metrics.map((metric) => (
        <div
          key={`${metric.label}-${metric.value}-${metric.unit ?? ""}`}
          className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-4 backdrop-blur-sm"
        >
          <p className="section-kicker mb-2">{metric.label}</p>
          <div className="flex items-end gap-1">
            <span className="tabular-nums text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--ink-1)]">
              {metric.value}
            </span>
            {metric.unit ? (
              <span className="pb-1 text-[0.75rem] uppercase tracking-[0.18em] text-[var(--ink-3)]">
                {metric.unit}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
