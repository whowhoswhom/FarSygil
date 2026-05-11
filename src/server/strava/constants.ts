export const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
export const STRAVA_ACTIVITIES_URL =
  "https://www.strava.com/api/v3/athlete/activities";
export const STRAVA_REQUIRED_SCOPES = ["read", "activity:read_all"] as const;
export const STRAVA_OAUTH_SCOPE = STRAVA_REQUIRED_SCOPES.join(",");
export const STRAVA_OAUTH_STATE_COOKIE = "strava_oauth_state";
export const STRAVA_OAUTH_STATE_MAX_AGE_SECONDS = 600;
// Default safety margin used when deciding whether to silently refresh a
// stored Strava token. A non-zero leeway prevents long-running API callers
// from picking up a token that expires mid-request.
export const STRAVA_REFRESH_LEEWAY_SECONDS = 300;
// Sync callers page through many activities and may stay in-flight for longer
// than a simple metadata request, so they use a wider refresh margin.
export const STRAVA_SYNC_REFRESH_LEEWAY_SECONDS = 3600;
export const STRAVA_ACTIVITIES_PER_PAGE = 200;
