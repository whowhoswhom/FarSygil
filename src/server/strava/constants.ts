export const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
export const STRAVA_REQUIRED_SCOPES = ["read", "activity:read_all"] as const;
export const STRAVA_OAUTH_SCOPE = STRAVA_REQUIRED_SCOPES.join(",");
export const STRAVA_OAUTH_STATE_COOKIE = "strava_oauth_state";
export const STRAVA_OAUTH_STATE_MAX_AGE_SECONDS = 600;
