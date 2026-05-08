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
  config_error:
    "Strava app configuration is missing or invalid. Check your local settings and try again.",
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
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      aria-atomic="true"
      className={[
        "mb-6 rounded-[22px] border px-4 py-3 text-sm backdrop-blur-md",
        isSuccess
          ? "border-[rgba(168,226,108,0.22)] bg-[rgba(123,194,65,0.12)] text-[var(--ink-1)]"
          : "border-[var(--danger-soft)] bg-[rgba(229,102,74,0.12)] text-[var(--danger-ink)]",
      ].join(" ")}
    >
      {message}
    </div>
  );
}
