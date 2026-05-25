import { afterEach, describe, expect, it, vi } from "vitest";

import * as oauthModule from "@/server/strava/oauth";
import * as freshSyncModule from "@/server/strava/fresh-sync";
import { StravaSyncError } from "@/server/strava/sync";

vi.mock("@/db/client", () => ({
  db: {},
}));

vi.mock("@/server/strava/oauth", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/strava/oauth")>(
      "@/server/strava/oauth",
    );

  return {
    ...actual,
    getStravaOAuthConfig: vi.fn(),
  };
});

vi.mock("@/server/strava/fresh-sync", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/strava/fresh-sync")>(
      "@/server/strava/fresh-sync",
    );

  return {
    ...actual,
    syncStravaFreshData: vi.fn(),
  };
});

describe("Strava fresh sync route", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("returns a local config error when Strava env vars are missing", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaFreshDataMock = vi.mocked(
      freshSyncModule.syncStravaFreshData,
    );

    getStravaOAuthConfigMock.mockImplementation(() => {
      throw new Error("Missing required environment variable: STRAVA_CLIENT_ID");
    });

    const { POST } = await import("../../src/app/api/strava/sync-fresh/route");
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      error: "strava_config_error",
      message: "Strava sync is not configured locally.",
    });
    expect(syncStravaFreshDataMock).not.toHaveBeenCalled();
  });

  it("returns the combined fresh sync result as JSON", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaFreshDataMock = vi.mocked(
      freshSyncModule.syncStravaFreshData,
    );

    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "http://localhost:3000/api/strava/callback",
    });
    syncStravaFreshDataMock.mockResolvedValue({
      summary: {
        mode: "incremental",
        afterUnix: 1_715_212_800,
        activitiesFetched: 2,
        activitiesAdded: 1,
        activitiesUpdated: 1,
        pagesFetched: 1,
      },
      details: {
        mode: "incremental",
        activitiesScanned: 1,
        activitiesSynced: 1,
        detailsFetched: 1,
        streamsFetched: 1,
        splitsWritten: 12,
        streamsWritten: 7,
        rateLimitRetries: 0,
      },
      detailError: null,
      dailyStress: {
        activitiesScanned: 2,
        activitiesUsed: 2,
        daysWritten: 1,
        startDate: "2026-05-25",
        endDate: "2026-05-25",
      },
    });

    const { POST } = await import("../../src/app/api/strava/sync-fresh/route");
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload.summary.activitiesAdded).toBe(1);
    expect(payload.details.activitiesSynced).toBe(1);
    expect(payload.dailyStress.daysWritten).toBe(1);
    expect(syncStravaFreshDataMock).toHaveBeenCalledTimes(1);
  });

  it("maps helper connectivity failures to 401", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaFreshDataMock = vi.mocked(
      freshSyncModule.syncStravaFreshData,
    );

    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "http://localhost:3000/api/strava/callback",
    });
    syncStravaFreshDataMock.mockRejectedValue(
      new StravaSyncError(
        "No stored Strava connection found for sync",
        "not_connected",
      ),
    );

    const { POST } = await import("../../src/app/api/strava/sync-fresh/route");
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      error: "not_connected",
      message: "No stored Strava connection found for sync",
    });
  });
});
