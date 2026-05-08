import { LiquidSurface } from "@/components/activities/liquid-surface";
import {
  formatArchiveCount,
  formatDistanceMiles,
  formatElevationFeet,
  formatHours,
} from "@/lib/activities/format";
import type { ArchiveTotals } from "@/lib/activities/types";

export function SyncedTotalsStrip({ totals }: { totals: ArchiveTotals }) {
  const cells = [
    {
      label: "Efforts",
      value: totals.count > 0 ? formatArchiveCount(totals.count) : "—",
    },
    {
      label: "Distance",
      value:
        totals.distanceEntryCount > 0
          ? formatDistanceMiles(totals.totalDistanceMeters)
          : "—",
    },
    {
      label: "Elev gain",
      value:
        totals.elevationEntryCount > 0
          ? formatElevationFeet(totals.totalElevationGain)
          : "—",
    },
    {
      label: "Moving",
      value:
        totals.movingTimeEntryCount > 0
          ? formatHours(totals.totalMovingTimeSeconds)
          : "—",
    },
  ];

  return (
    <section className="mb-16">
      <LiquidSurface radius={22} className="archive-rise px-5 py-5 md:px-7 md:py-6">
        <p className="section-kicker mb-4">Synced totals</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cells.map((cell) => (
            <div
              key={cell.label}
              className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-4 backdrop-blur-sm"
            >
              <p className="section-kicker mb-2">{cell.label}</p>
              <p className="ink-safe tabular-nums text-[1.8rem] font-semibold tracking-[-0.05em] text-white">
                {cell.value}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--ink-2)]">
          Totals derive from real activities in your local database.
        </p>
      </LiquidSurface>
    </section>
  );
}
