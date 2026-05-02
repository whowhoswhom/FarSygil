import { afterEach, describe, expect, it, vi } from "vitest";
import * as oauthModule from "@/server/strava/oauth";

vi.mock("@/server/strava/oauth", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/strava/oauth")>(
      "@/server/strava/oauth",
    );

  return {
    ...actual,
    getStravaOAuthConfig: vi.fn(),
    generateOAuthState: vi.fn(),
  };
});

describe("Strava connect route", () => {
  afterEach(() => {
    vi.resetAllMocks();
    // The production-branch test stubs NODE_ENV, so restore the real process
    // env before the next route import or cookie assertions can bleed across tests.
    vi.unstubAllEnvs();
    // The route is dynamically imported in each test, so reset the module
    // cache or later tests will reuse the first mocked route instance.
    vi.resetModules();
  });

  it("redirects to Strava authorize and sets the real state cookie attributes", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const generateOAuthStateMock = vi.mocked(oauthModule.generateOAuthState);

    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "http://localhost:3000/api/strava/callback",
    });
    generateOAuthStateMock.mockReturnValue("state-123");

    const { GET } = await import("../../src/app/api/strava/connect/route");
    const response = GET();

    expect(response.status).toBe(302);
    expect(generateOAuthStateMock).toHaveBeenCalledTimes(1);
    expect(getStravaOAuthConfigMock).toHaveBeenCalledTimes(1);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const authorizeUrl = new URL(location!);

    expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(
      "https://www.strava.com/oauth/authorize",
    );
    expect(authorizeUrl.searchParams.get("client_id")).toBe("12345");
    expect(authorizeUrl.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/strava/callback",
    );
    expect(authorizeUrl.searchParams.get("response_type")).toBe("code");
    expect(authorizeUrl.searchParams.get("approval_prompt")).toBe("auto");
    expect(authorizeUrl.searchParams.get("scope")).toBe(
      "read,activity:read_all",
    );
    expect(authorizeUrl.searchParams.get("state")).toBe("state-123");

    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("strava_oauth_state=state-123");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("SameSite=lax");
    expect(setCookieHeader).toContain("Max-Age=600");
    expect(setCookieHeader).toContain("Path=/");
    expect(setCookieHeader).not.toContain("Secure");
  });

  it("sets the Secure flag on the state cookie in production HTTPS flows", async () => {
    const getStravaOAuthConfigMock = vi.mocked(oauthModule.getStravaOAuthConfig);
    const generateOAuthStateMock = vi.mocked(oauthModule.generateOAuthState);

    vi.stubEnv("NODE_ENV", "production");
    getStravaOAuthConfigMock.mockReturnValue({
      clientId: "12345",
      clientSecret: "secret-value",
      redirectUri: "https://localhost:3000/api/strava/callback",
    });
    generateOAuthStateMock.mockReturnValue("state-456");

    const { GET } = await import("../../src/app/api/strava/connect/route");
    const response = GET();

    expect(response.status).toBe(302);
    expect(generateOAuthStateMock).toHaveBeenCalledTimes(1);
    expect(getStravaOAuthConfigMock).toHaveBeenCalledTimes(1);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const authorizeUrl = new URL(location!);

    expect(authorizeUrl.searchParams.get("redirect_uri")).toBe(
      "https://localhost:3000/api/strava/callback",
    );
    expect(authorizeUrl.searchParams.get("state")).toBe("state-456");

    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("strava_oauth_state=state-456");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("SameSite=lax");
    expect(setCookieHeader).toContain("Max-Age=600");
    expect(setCookieHeader).toContain("Path=/");
    expect(setCookieHeader).toContain("Secure");
  });
});
