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
            href: "/health",
          },
          {
            label: "Sleep",
            source: "Apple Health",
            available: false,
            detail: "Missing Apple Health Sleep in local SQLite.",
            href: "/health",
          },
        ]}
      />,
    );

    expect(html).toContain("Daily Battery (deferred)");
    expect(html).toContain("Present");
    expect(html).toContain("Absent");
    expect(html).toContain("No battery score is computed");
    expect(html).toContain('href="/health"');
    expect(html).not.toContain(">--<");
    expect(html).not.toContain("72%");
  });

  it("renders all Daily Battery inputs absent without a score slot", () => {
    const html = renderToStaticMarkup(
      <DailyBatteryDeferredCard
        inputs={[
          {
            label: "HRV",
            source: "Apple Health",
            available: false,
            detail: "Missing Apple Health HRV in local SQLite.",
            href: "/health",
          },
          {
            label: "Resting HR",
            source: "Apple Health",
            available: false,
            detail: "Missing Apple Health Resting HR in local SQLite.",
            href: "/health",
          },
          {
            label: "Sleep",
            source: "Apple Health",
            available: false,
            detail: "Missing Apple Health Sleep in local SQLite.",
            href: "/health",
          },
          {
            label: "Daily Stress",
            source: "Derived",
            available: false,
            detail: "Missing computed daily stress from /training-load.",
            href: "/training-load",
          },
        ]}
      />,
    );

    expect(html.match(/Absent/g)).toHaveLength(4);
    expect(html).toContain('href="/health"');
    expect(html).toContain('href="/training-load"');
    expect(html).toContain("No battery score is computed");
    expect(html).not.toContain(">--<");
    expect(html).not.toContain("72%");
  });

  it("renders all Daily Battery inputs present without computing a score", () => {
    const html = renderToStaticMarkup(
      <DailyBatteryDeferredCard
        inputs={[
          {
            label: "HRV",
            source: "Apple Health",
            available: true,
            detail: "Latest Apple Health HRV exists for 2026-05-12.",
            href: "/health",
          },
          {
            label: "Resting HR",
            source: "Apple Health",
            available: true,
            detail: "Latest Apple Health Resting HR exists for 2026-05-12.",
            href: "/health",
          },
          {
            label: "Sleep",
            source: "Apple Health",
            available: true,
            detail: "Latest Apple Health Sleep exists for 2026-05-12.",
            href: "/health",
          },
          {
            label: "Daily Stress",
            source: "Derived",
            available: true,
            detail: "Computed local stress exists for 2026-05-12.",
            href: "/training-load",
          },
        ]}
      />,
    );

    expect(html.match(/Present/g)).toHaveLength(4);
    expect(html).toContain("No battery score is computed");
    expect(html).not.toContain("Daily Battery Score");
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

  it("renders compact Archive Status with an archive link", () => {
    const snapshot = buildArchiveSnapshot({
      databasePath: "C:\\data\\running.db",
    });

    const html = renderToStaticMarkup(
      <ArchiveStatusCard snapshot={snapshot} href="/archive" compact />,
    );

    expect(html).toContain("Archive Status");
    expect(html).toContain('href="/archive"');
    expect(html).not.toContain("Detail Coverage");
    expect(html).not.toContain("Stream Coverage");
  });

  it("renders local SQLite fallback when the database path is unavailable", () => {
    const snapshot = buildArchiveSnapshot({
      databasePath: null,
    });

    const html = renderToStaticMarkup(<ArchiveStatusCard snapshot={snapshot} />);

    expect(html).toContain("Local SQLite");
  });
});

function buildArchiveSnapshot({
  databasePath,
}: {
  databasePath: string | null;
}): ArchiveStatusSnapshot {
  return {
    databasePath,
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
}
