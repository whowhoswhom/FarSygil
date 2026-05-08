import { hasDisplayDistance } from "@/lib/activities/format";
import type { ArchiveActivity, ArchiveTotals } from "@/lib/activities/types";

export function computeArchiveTotals(
  activities: ArchiveActivity[],
): ArchiveTotals {
  return activities.reduce<ArchiveTotals>(
    (totals, activity) => {
      const hasDistance = hasDisplayDistance(activity);
      const hasMovingTime =
        typeof activity.movingTimeSeconds === "number" &&
        activity.movingTimeSeconds >= 0;
      const hasElevation =
        typeof activity.totalElevationGain === "number" &&
        activity.totalElevationGain >= 0;

      return {
        count: totals.count + 1,
        totalDistanceMeters:
          totals.totalDistanceMeters + (hasDistance ? activity.distanceMeters ?? 0 : 0),
        totalMovingTimeSeconds:
          totals.totalMovingTimeSeconds +
          (hasMovingTime ? activity.movingTimeSeconds ?? 0 : 0),
        totalElevationGain:
          totals.totalElevationGain +
          (hasElevation ? activity.totalElevationGain ?? 0 : 0),
        distanceEntryCount: totals.distanceEntryCount + (hasDistance ? 1 : 0),
        movingTimeEntryCount: totals.movingTimeEntryCount + (hasMovingTime ? 1 : 0),
        elevationEntryCount: totals.elevationEntryCount + (hasElevation ? 1 : 0),
      };
    },
    {
      count: 0,
      totalDistanceMeters: 0,
      totalMovingTimeSeconds: 0,
      totalElevationGain: 0,
      distanceEntryCount: 0,
      movingTimeEntryCount: 0,
      elevationEntryCount: 0,
    },
  );
}
