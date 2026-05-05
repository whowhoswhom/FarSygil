import {
  formatArchiveCount,
  formatDistanceMiles,
  formatElevationFeet,
  formatHours,
} from "@/lib/activities/format";
import type { ArchiveTotals } from "@/lib/activities/types";

export function ArchiveStrip({ totals }: { totals: ArchiveTotals }) {
  return (
    <div className="mb-14 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-5 backdrop-blur-md md:px-7">
      <p className="section-kicker mb-3">Synced archive</p>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3 text-white">
        <span className="tabular-nums text-2xl font-semibold tracking-[-0.05em] md:text-[2.5rem]">
          {formatArchiveCount(totals.count)}
        </span>
        <span className="tabular-nums text-xl font-medium tracking-[-0.04em] text-[var(--ink-2)] md:text-[2rem]">
          {formatDistanceMiles(totals.totalDistanceMeters)}
        </span>
        <span className="tabular-nums text-xl font-medium tracking-[-0.04em] text-[var(--ink-2)] md:text-[2rem]">
          {formatElevationFeet(totals.totalElevationGain)}
        </span>
        <span className="tabular-nums text-base uppercase tracking-[0.16em] text-[var(--ink-3)] md:text-lg">
          {formatHours(totals.totalMovingTimeSeconds)} moving
        </span>
      </div>
    </div>
  );
}
