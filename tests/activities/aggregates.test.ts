import { describe, expect, it } from "vitest";
import { computeArchiveTotals } from "../../src/lib/activities/aggregates";
import type { ArchiveActivity } from "../../src/lib/activities/types";

const activities: ArchiveActivity[] = [
  {
    id: 1,
    stravaId: 1,
    name: "Run",
    sportType: "Run",
    startDate: "2026-05-04T17:28:04Z",
    startDateLocal: "2026-05-04T13:28:04Z",
    timezone: null,
    distanceMeters: 5000,
    movingTimeSeconds: 1500,
    elapsedTimeSeconds: 1500,
    totalElevationGain: 50,
    averageSpeed: null,
    maxSpeed: null,
    averageHeartrate: null,
    maxHeartrate: null,
    averageCadence: null,
    averageWatts: null,
    sufferScore: null,
    perceivedExertion: null,
    startLatitude: null,
    startLongitude: null,
    routePathData: null,
    source: "strava",
  },
  {
    id: 2,
    stravaId: 2,
    name: "Ride",
    sportType: "Ride",
    startDate: "2026-05-03T17:28:04Z",
    startDateLocal: "2026-05-03T13:28:04Z",
    timezone: null,
    distanceMeters: 10000,
    movingTimeSeconds: 2100,
    elapsedTimeSeconds: 2100,
    totalElevationGain: 100,
    averageSpeed: null,
    maxSpeed: null,
    averageHeartrate: null,
    maxHeartrate: null,
    averageCadence: null,
    averageWatts: null,
    sufferScore: null,
    perceivedExertion: null,
    startLatitude: null,
    startLongitude: null,
    routePathData: null,
    source: "strava",
  },
];

describe("archive totals", () => {
  it("sums count, distance, time, and elevation", () => {
    expect(computeArchiveTotals(activities)).toEqual({
      count: 2,
      totalDistanceMeters: 15000,
      totalMovingTimeSeconds: 3600,
      totalElevationGain: 150,
      distanceEntryCount: 2,
      movingTimeEntryCount: 2,
      elevationEntryCount: 2,
    });
  });

  it("tracks usable rows per metric instead of inventing totals", () => {
    expect(
      computeArchiveTotals([
        {
          ...activities[0],
          sportType: "WeightTraining",
          distanceMeters: 0,
          totalElevationGain: null,
        },
      ]),
    ).toEqual({
      count: 1,
      totalDistanceMeters: 0,
      totalMovingTimeSeconds: 1500,
      totalElevationGain: 0,
      distanceEntryCount: 0,
      movingTimeEntryCount: 1,
      elevationEntryCount: 0,
    });
  });
});
