import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { SyncPanel } from "@/components/connect/sync-panel";
import type { StravaSyncLogEntry } from "@/server/strava/sync-logs";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("SyncPanel", () => {
  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("shows last success, last error, and an actionable next step", () => {
    const html = renderToStaticMarkup(
      <SyncPanel
        connected={true}
        logs={[
          syncLog({
            id: 2,
            eventType: "sync_error",
            message: "Strava activities fetch failed (HTTP 429)",
            startedAt: "2026-05-25 10:00:00",
            completedAt: "2026-05-25 10:00:01",
            errorsCount: 1,
          }),
          syncLog({
            id: 1,
            eventType: "sync_complete",
            message: "Strava incremental sync completed.",
            startedAt: "2026-05-25 08:00:00",
            completedAt: "2026-05-25 08:00:01",
          }),
        ]}
        coverage={{
          totalActivities: 10,
          detailActivities: 4,
          streamActivities: 4,
        }}
      />,
    );

    expect(html).toContain("Last success");
    expect(html).toContain("Last error");
    expect(html).toContain("Strava activities fetch failed (HTTP 429)");
    expect(html).toContain("Auto-refresh paused");
    expect(html).toContain("Background freshness waits");
    expect(html).toContain("Background auto-refresh is paused");
    expect(html).toContain("use Refresh latest");
    expect(html).not.toContain("Reconnect Strava");
  });

  it("points connected users to missing detail backfill when summary sync is healthy", () => {
    const html = renderToStaticMarkup(
      <SyncPanel
        connected={true}
        logs={[
          syncLog({
            id: 1,
            eventType: "sync_complete",
            message: "Strava incremental sync completed.",
            startedAt: "2026-05-25 08:00:00",
            completedAt: "2026-05-25 08:00:01",
          }),
        ]}
        coverage={{
          totalActivities: 10,
          detailActivities: 4,
          streamActivities: 4,
        }}
      />,
    );

    expect(html).toContain("Use Missing details");
  });
});

function syncLog(
  overrides: Partial<StravaSyncLogEntry>,
): StravaSyncLogEntry {
  return {
    id: 1,
    source: "strava",
    eventType: "sync_complete",
    message: null,
    activitiesAdded: 0,
    activitiesUpdated: 0,
    errorsCount: 0,
    startedAt: "2026-05-25 08:00:00",
    completedAt: "2026-05-25 08:00:01",
    ...overrides,
  };
}
