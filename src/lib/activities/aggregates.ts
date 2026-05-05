import type { ArchiveActivity, ArchiveTotals } from "@/lib/activities/types";

export function computeArchiveTotals(
  activities: ArchiveActivity[],
): ArchiveTotals {
  return activities.reduce<ArchiveTotals>(
    (totals, activity) => ({
      count: totals.count + 1,
      totalDistanceMeters:
        totals.totalDistanceMeters + (activity.distanceMeters ?? 0),
      totalMovingTimeSeconds:
        totals.totalMovingTimeSeconds + (activity.movingTimeSeconds ?? 0),
      totalElevationGain:
        totals.totalElevationGain + (activity.totalElevationGain ?? 0),
    }),
    {
      count: 0,
      totalDistanceMeters: 0,
      totalMovingTimeSeconds: 0,
      totalElevationGain: 0,
    },
  );
}
