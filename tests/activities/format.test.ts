import { describe, expect, it } from "vitest";
import {
  effortIntensity,
  formatDistanceMiles,
  formatElevationFeet,
  formatPaceOrSpeed,
  metricsFor,
  primaryMetricFor,
} from "../../src/lib/activities/format";
import type { ArchiveActivity } from "../../src/lib/activities/types";

const baseActivity: ArchiveActivity = {
  id: 1,
  stravaId: 1,
  name: "Morning Run",
  sportType: "Run",
  startDate: "2026-05-04T17:28:04Z",
  startDateLocal: "2026-05-04T13:28:04Z",
  timezone: "(GMT-05:00) America/Kentucky/Louisville",
  distanceMeters: 8046.72,
  movingTimeSeconds: 2400,
  elapsedTimeSeconds: 2400,
  totalElevationGain: 30.48,
  averageSpeed: 3.35,
  maxSpeed: 4.5,
  averageHeartrate: 150,
  maxHeartrate: 171,
  averageCadence: 86,
  averageWatts: 240,
  sufferScore: 125,
  perceivedExertion: null,
  startLatitude: null,
  startLongitude: null,
  routePathData: "M0 0 L10 10",
  source: "strava",
};

describe("activity formatting", () => {
  it("formats imperial distance and elevation values", () => {
    expect(formatDistanceMiles(8046.72)).toBe("5.0 mi");
    expect(formatElevationFeet(30.48)).toBe("100 ft");
  });

  it("formats run pace in minutes per mile", () => {
    expect(formatPaceOrSpeed(baseActivity)).toBe("8:00");
  });

  it("scales suffer score intensity with the /250 divisor", () => {
    expect(effortIntensity(baseActivity)).toBeCloseTo(0.5);
  });

  it("uses honest indoor-ride metrics instead of synthesizing distance", () => {
    const indoorRide: ArchiveActivity = {
      ...baseActivity,
      sportType: "Ride",
      distanceMeters: 0,
      movingTimeSeconds: 3600,
      averageWatts: 210,
      routePathData: null,
    };

    expect(primaryMetricFor(indoorRide)).toMatchObject({
      label: "Duration",
      value: "1h 00",
    });
    expect(metricsFor(indoorRide)).toEqual([
      { label: "Duration", value: "1h 00" },
      { label: "Avg HR", value: "150", unit: "bpm" },
      { label: "Power", value: "210", unit: "W" },
    ]);
  });
});
