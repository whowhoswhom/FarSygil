import { describe, expect, it, vi } from "vitest";

import { syncStravaFreshData } from "@/server/strava/fresh-sync";
import * as detailSyncModule from "@/server/strava/detail-sync";
import * as syncModule from "@/server/strava/sync";
import * as dailyStressModule from "@/server/training-load/daily-stress";

vi.mock("@/server/strava/sync", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/strava/sync")>(
      "@/server/strava/sync",
    );

  return {
    ...actual,
    syncStravaActivities: vi.fn(),
  };
});

vi.mock("@/server/strava/detail-sync", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/strava/detail-sync")>(
      "@/server/strava/detail-sync",
    );

  return {
    ...actual,
    syncStravaActivityDetails: vi.fn(),
  };
});

vi.mock("@/server/training-load/daily-stress", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/training-load/daily-stress")>(
      "@/server/training-load/daily-stress",
    );

  return {
    ...actual,
    recomputeDailyTrainingStress: vi.fn(),
  };
});

describe("Strava fresh sync", () => {
  it("keeps summary freshness and daily stress when detail backfill is rate-limited", async () => {
    const syncStravaActivitiesMock = vi.mocked(syncModule.syncStravaActivities);
    const syncStravaActivityDetailsMock = vi.mocked(
      detailSyncModule.syncStravaActivityDetails,
    );
    const recomputeDailyTrainingStressMock = vi.mocked(
      dailyStressModule.recomputeDailyTrainingStress,
    );
    const errorLogger = vi.fn();

    syncStravaActivitiesMock.mockResolvedValue({
      mode: "incremental",
      afterUnix: 1_715_212_800,
      activitiesFetched: 1,
      activitiesAdded: 1,
      activitiesUpdated: 0,
      pagesFetched: 1,
    });
    syncStravaActivityDetailsMock.mockRejectedValue(
      new detailSyncModule.StravaDetailSyncError(
        "Strava detail activity failed (HTTP 429)",
        "fetch_failed",
      ),
    );
    recomputeDailyTrainingStressMock.mockResolvedValue({
      activitiesScanned: 1,
      activitiesUsed: 1,
      daysWritten: 1,
      startDate: "2026-05-25",
      endDate: "2026-05-25",
    });

    const result = await syncStravaFreshData({
      database: {} as never,
      config: {
        clientId: "12345",
        clientSecret: "secret",
        redirectUri: "http://localhost:3000/api/strava/callback",
      },
      errorLogger,
    });

    expect(result.summary.activitiesAdded).toBe(1);
    expect(result.details).toBeNull();
    expect(result.detailError).toContain("HTTP 429");
    expect(result.dailyStress.daysWritten).toBe(1);
    expect(errorLogger).toHaveBeenCalledWith(
      expect.stringContaining("detail backfill deferred"),
    );
  });
});
