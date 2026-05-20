import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  ArchiveStatusCard,
  DailyBatteryDeferredCard,
} from "../../src/components/visual-reboot";
import type { ArchiveStatusSnapshot } from "../../src/server/archive/status";

describe("dashboard deferred and provenance cards", () => {
  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("renders Daily Battery as an input checklist without a score placeholder", () => {
    const html = renderToStaticMarkup(
      <DailyBatteryDeferredCard
        inputs={[
          {
            label: "HRV",
            source: "Apple Health",
            available: true,
            detail: "Latest Apple Health HRV exists for 2026-05-12.",
          },
          {
            label: "Sleep",
            source: "Apple Health",
            available: false,
            detail: "Missing Apple Health Sleep in local SQLite.",
          },
        ]}
      />,
    );

    expect(html).toContain("Daily Battery (deferred)");
    expect(html).toContain("Present");
    expect(html).toContain("Absent");
    expect(html).toContain("No battery score is computed");
    expect(html).not.toContain(">--<");
    expect(html).not.toContain("72%");
  });

  it("renders Archive Status as read-only local provenance", () => {
    const snapshot: ArchiveStatusSnapshot = {
      databasePath: "C:\\data\\running.db",
      counts: {
        activities: 12,
        stravaActivities: 10,
        healthMetricRows: 300,
        trainingLoadRows: 14,
      },
      latest: {
        stravaSyncAt: "2026-05-12 06:05:00",
        appleHealthImportAt: "2026-05-14 07:00:00",
        latestHealthMetricDate: "2026-05-13",
        latestDailyStressDate: "2026-05-15",
        latestLocalWriteAt: "2026-05-16 10:00:00",
      },
      coverage: {
        totalStravaActivities: 10,
        detailedActivities: 8,
        streamActivities: 6,
        detailCoveragePercent: 80,
        streamCoveragePercent: 60,
      },
    };

    const html = renderToStaticMarkup(<ArchiveStatusCard snapshot={snapshot} />);

    expect(html).toContain("Archive Status");
    expect(html).toContain("Local SQLite provenance");
    expect(html).toContain("C:\\data\\running.db");
    expect(html).toContain("80% (8/10)");
    expect(html).toContain("60% (6/10)");
    expect(html).not.toContain("Compute daily stress");
    expect(html).not.toContain("Connect Strava");
  });
});
