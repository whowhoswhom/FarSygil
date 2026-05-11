import { afterEach, describe, expect, it, vi } from "vitest";
import * as oauthModule from "@/server/strava/oauth";
import * as syncModule from "@/server/strava/sync";

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

describe("Strava sync route", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("returns a local config error when Strava env vars are missing", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaActivitiesMock = vi.mocked(syncModule.syncStravaActivities);

    getStravaOAuthConfigMock.mockImplementation(() => {
      throw new Error("Missing required environment variable: STRAVA_CLIENT_ID");
    });

    const { POST } = await import("../../src/app/api/strava/sync/route");
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      error: "strava_config_error",
      message: "Strava sync is not configured locally.",
    });
    expect(syncStravaActivitiesMock).not.toHaveBeenCalled();
  });

  it("returns sync results as JSON on success", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaActivitiesMock = vi.mocked(syncModule.syncStravaActivities);

    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "http://localhost:3000/api/strava/callback",
    });
    syncStravaActivitiesMock.mockResolvedValue({
      mode: "incremental",
      afterUnix: 1715212800,
      activitiesFetched: 5,
      activitiesAdded: 3,
      activitiesUpdated: 2,
      pagesFetched: 1,
    });

    const { POST } = await import("../../src/app/api/strava/sync/route");
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      mode: "incremental",
      afterUnix: 1715212800,
      activitiesFetched: 5,
      activitiesAdded: 3,
      activitiesUpdated: 2,
      pagesFetched: 1,
    });
    expect(syncStravaActivitiesMock).toHaveBeenCalledTimes(1);
  });

  it("maps sync helper connectivity failures to 401", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const syncStravaActivitiesMock = vi.mocked(syncModule.syncStravaActivities);

    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "http://localhost:3000/api/strava/callback",
    });
    syncStravaActivitiesMock.mockRejectedValue(
      new syncModule.StravaSyncError(
        "No stored Strava connection found for sync",
        "not_connected",
      ),
    );

    const { POST } = await import("../../src/app/api/strava/sync/route");
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
