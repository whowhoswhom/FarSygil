"use client";

import { useSearchParams } from "next/navigation";

const STRAVA_STATUS_MESSAGES: Record<string, string> = {
  connected: "Strava connected. Token storage is ready; activity sync is next.",
  access_denied: "Strava authorization was cancelled before access was granted.",
  missing_code: "Strava did not return an authorization code.",
  missing_scope:
    "Strava authorization must include read and activity:read_all scopes.",
  invalid_state:
    "Strava authorization could not be verified. Start the connection flow again.",
  exchange_failed:
    "Strava returned an error while exchanging the authorization code for tokens.",
  storage_failed:
    "Strava connected, but FarSygil could not store the token locally.",
};

export function StravaStatusBanner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("strava");

  if (!status) {
    return null;
  }

  const message =
    STRAVA_STATUS_MESSAGES[status] ??
    "Strava connection could not be completed. Check your app settings and try again.";
  const isSuccess = status === "connected";

  return (
    <div
      className={[
        "mb-8 rounded-2xl border px-4 py-3 text-sm",
        isSuccess
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-amber-500/30 bg-amber-500/10 text-amber-100",
      ].join(" ")}
    >
      {message}
    </div>
  );
}
