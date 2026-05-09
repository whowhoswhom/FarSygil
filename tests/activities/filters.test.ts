import { describe, expect, it } from "vitest";
import {
  applyActivityFilters,
  buildFilterSearchParams,
  DEFAULT_FILTERS,
  getSportOptions,
  parseActivityFilters,
} from "../../src/lib/activities/filters";
import type { ArchiveActivity } from "../../src/lib/activities/types";

const activities: ArchiveActivity[] = [
  {
    id: 1,
    stravaId: 1,
    name: "Morning Run",
    sportType: "Run",
    startDate: "2026-05-04T17:28:04Z",
    startDateLocal: null,
    timezone: null,
    distanceMeters: 8046.72,
    movingTimeSeconds: 2400,
    elapsedTimeSeconds: 2400,
    totalElevationGain: 30.48,
    averageSpeed: null,
    maxSpeed: null,
    averageHeartrate: 150,
    maxHeartrate: 171,
    averageCadence: null,
    averageWatts: null,
    sufferScore: 125,
    perceivedExertion: null,
    startLatitude: null,
    startLongitude: null,
    routePathData: "M0 0 L10 10",
    source: "strava",
  },
  {
    id: 2,
    stravaId: 2,
    name: "Gym Session",
    sportType: "WeightTraining",
    startDate: "2026-05-03T17:28:04Z",
    startDateLocal: null,
    timezone: null,
    distanceMeters: 0,
    movingTimeSeconds: 3600,
    elapsedTimeSeconds: 3600,
    totalElevationGain: 0,
    averageSpeed: null,
    maxSpeed: null,
    averageHeartrate: 130,
    maxHeartrate: 160,
    averageCadence: null,
    averageWatts: null,
    sufferScore: 80,
    perceivedExertion: null,
    startLatitude: null,
    startLongitude: null,
    routePathData: null,
    source: "strava",
  },
];

describe("activity filters", () => {
  it("parses and serializes non-default URL state", () => {
    const params = new URLSearchParams(
      "sport=Run&range=90d&sort=distance&minDistanceMiles=4&search=morning",
    );
    const parsed = parseActivityFilters(params, ["Run", "WeightTraining"]);

    expect(parsed).toEqual({
      sport: "Run",
      range: "90d",
      sort: "distance",
      minDistanceMiles: 4,
      minPowerWatts: 0,
      search: "morning",
    });
    expect(buildFilterSearchParams(parsed).toString()).toBe(params.toString());
  });

  it("falls back to defaults for invalid values", () => {
    const parsed = parseActivityFilters(
      new URLSearchParams("sport=Bike&range=7d&sort=watts"),
      ["Run", "WeightTraining"],
    );

    expect(parsed).toEqual(DEFAULT_FILTERS);
  });

  it("filters by sport, distance, and search", () => {
    const visible = applyActivityFilters(activities, {
      sport: "Run",
      range: "all",
      sort: "recent",
      minDistanceMiles: 4,
      minPowerWatts: 0,
      search: "morning",
    });

    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe(1);
  });

  it("collapses Workout into Strength and removes Stairs from sport options", () => {
    const options = getSportOptions([
      ...activities,
      {
        ...activities[1],
        id: 3,
        sportType: "Workout",
      },
      {
        ...activities[1],
        id: 4,
        sportType: "StairStepper",
      },
    ]);

    expect(options).toContain("WeightTraining");
    expect(options).not.toContain("Workout");
    expect(options).not.toContain("StairStepper");
  });

  it("uses min power when Ride is the selected sport", () => {
    const visible = applyActivityFilters(
      [
        {
          ...activities[0],
          id: 10,
          sportType: "Ride",
          distanceMeters: 0,
          averageWatts: 180,
        },
        {
          ...activities[0],
          id: 11,
          sportType: "Ride",
          distanceMeters: 0,
          averageWatts: 240,
        },
      ],
      {
        sport: "Ride",
        range: "all",
        sort: "recent",
        minDistanceMiles: 0,
        minPowerWatts: 200,
        search: "",
      },
    );

    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe(11);
  });
});
