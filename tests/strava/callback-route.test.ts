import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
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
    handleStravaCallback: vi.fn(),
  };
});

describe("Strava callback route", () => {
  afterEach(() => {
    vi.resetAllMocks();
    // The route is dynamically imported in each test, so reset the module
    // cache or later tests will reuse the first mocked route instance.
    vi.resetModules();
  });

  it("redirects home with config_error and clears the state cookie when env config is missing", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const handleStravaCallbackMock = vi.mocked(oauthModule.handleStravaCallback);

    getStravaOAuthConfigMock.mockImplementation(() => {
      throw new Error("Missing required environment variable: STRAVA_CLIENT_ID");
    });

    const { GET } = await import("../../src/app/api/strava/callback/route");
    const request = new NextRequest(
      "http://localhost:3000/api/strava/callback?code=test-code&state=state-123",
      {
        headers: {
          cookie: "strava_oauth_state=state-123",
        },
      },
    );

    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/?strava=config_error",
    );
    expect(handleStravaCallbackMock).not.toHaveBeenCalled();

    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("strava_oauth_state=");
    expect(setCookieHeader).toContain("Max-Age=0");
    expect(setCookieHeader).toContain("HttpOnly");
  });

  it("rethrows unexpected callback helper failures instead of relabeling them as config_error", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const handleStravaCallbackMock = vi.mocked(oauthModule.handleStravaCallback);

    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "http://localhost:3000/api/strava/callback",
    });
    handleStravaCallbackMock.mockRejectedValue(
      new Error("unexpected callback helper failure"),
    );

    const { GET } = await import("../../src/app/api/strava/callback/route");
    const request = new NextRequest(
      "http://localhost:3000/api/strava/callback?code=test-code&scope=read,activity:read_all&state=state-123",
      {
        headers: {
          cookie: "strava_oauth_state=state-123",
        },
      },
    );

    await expect(GET(request)).rejects.toThrow(
      "unexpected callback helper failure",
    );
    expect(handleStravaCallbackMock).toHaveBeenCalledTimes(1);
  });
});
