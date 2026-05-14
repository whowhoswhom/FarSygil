import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as detailSyncModule from "@/server/strava/detail-sync";
import * as oauthModule from "@/server/strava/oauth";

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

describe("Strava detail sync route", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("returns a local config error when Strava env vars are missing", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaActivityDetailsMock = vi.mocked(
      detailSyncModule.syncStravaActivityDetails,
    );

    getStravaOAuthConfigMock.mockImplementation(() => {
      throw new Error("Missing required environment variable: STRAVA_CLIENT_ID");
    });

    const { POST } = await import("../../src/app/api/strava/sync-details/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/strava/sync-details", {
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      error: "strava_config_error",
      message: "Strava detail sync is not configured locally.",
    });
    expect(syncStravaActivityDetailsMock).not.toHaveBeenCalled();
  });

  it("returns detail sync results as JSON on success", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaActivityDetailsMock = vi.mocked(
      detailSyncModule.syncStravaActivityDetails,
    );

    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "http://localhost:3000/api/strava/callback",
    });
    syncStravaActivityDetailsMock.mockResolvedValue({
      mode: "full",
      activitiesScanned: 12,
      activitiesSynced: 12,
      detailsFetched: 12,
      streamsFetched: 12,
      splitsWritten: 44,
      streamsWritten: 84,
      rateLimitRetries: 2,
    });

    const { POST } = await import("../../src/app/api/strava/sync-details/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/strava/sync-details", {
        method: "POST",
        body: JSON.stringify({ mode: "full" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload.mode).toBe("full");
    expect(syncStravaActivityDetailsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "full",
      }),
    );
  });

  it("maps detail sync connectivity failures to 401", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaActivityDetailsMock = vi.mocked(
      detailSyncModule.syncStravaActivityDetails,
    );

    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "http://localhost:3000/api/strava/callback",
    });
    syncStravaActivityDetailsMock.mockRejectedValue(
      new detailSyncModule.StravaDetailSyncError(
        "No stored Strava connection found for detail sync",
        "not_connected",
      ),
    );

    const { POST } = await import("../../src/app/api/strava/sync-details/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/strava/sync-details", {
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      error: "not_connected",
      message: "No stored Strava connection found for detail sync",
    });
  });
});
