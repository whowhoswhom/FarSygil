import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import * as dashboardStravaModule from "@/server/dashboard/strava";

vi.mock("@/db/client", () => ({
  databasePath: "data/running.db",
  db: {},
}));

vi.mock("@/lib/apple-health/display", () => ({
  buildAppleHealthDashboardMetrics: vi.fn(() => []),
  getAppleHealthDashboardMetricTypes: vi.fn(() => []),
}));

vi.mock("@/server/apple-health/queries", () => ({
  getAppleHealthImportSummary: vi.fn(async () => ({
    latestMetricDate: null,
    metricRows: 0,
  })),
  getAppleHealthMetricTrendSeries: vi.fn(async () => []),
  getLatestAppleHealthMetrics: vi.fn(async () => []),
}));

vi.mock("@/server/archive/status", () => ({
  getArchiveStatusSnapshot: vi.fn(async () => ({})),
}));

vi.mock("@/server/training-load/daily-stress", () => ({
  getDailyTrainingStressSnapshot: vi.fn(async () => ({
    latest: null,
    series: [],
  })),
}));

vi.mock("@/server/dashboard/strava", () => ({
  getDashboardRunningSnapshot: vi.fn(),
}));

vi.mock("@/components/visual-reboot", () => ({
  ArchiveStatusCard: () => createElement("section", { "data-card": "archive" }),
  DailyBatteryDeferredCard: () =>
    createElement("section", { "data-card": "daily-battery" }),
  DashboardDailyStressCard: () =>
    createElement("section", { "data-card": "daily-stress" }),
  DashboardHealthClusterCard: () =>
    createElement("section", { "data-card": "health" }),
  DashboardMetricTile: () => createElement("section", { "data-card": "metric" }),
  DashboardRecentRunCard: () =>
    createElement("section", { "data-card": "recent-run" }),
  DashboardRecoveryCard: () =>
    createElement("section", { "data-card": "recovery" }),
  DashboardTrainingLoadCard: () =>
    createElement("section", { "data-card": "training-load" }),
  DashboardWeeklySummaryCard: ({
    title,
    subtitle,
    weekNavigation,
  }: {
    title: string;
    subtitle: string;
    weekNavigation?: {
      previousHref: string;
      nextHref: string | null;
      currentHref: string;
      isCurrentWeek: boolean;
    };
  }) =>
    createElement(
      "section",
      {
        "data-card": "weekly",
        "data-title": title,
        "data-subtitle": subtitle,
        "data-previous": weekNavigation?.previousHref,
        "data-next": weekNavigation?.nextHref ?? "none",
        "data-current": weekNavigation?.currentHref,
        "data-is-current": String(weekNavigation?.isCurrentWeek),
      },
      title,
    ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => createElement("a", { href, ...props }, children),
}));

describe("dashboard page week routing", () => {
  beforeAll(async () => {
    vi.stubGlobal("React", await import("react"));
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-27T12:00:00.000Z"));
    vi.mocked(dashboardStravaModule.getDashboardRunningSnapshot).mockReset();
    vi.mocked(dashboardStravaModule.getDashboardRunningSnapshot).mockResolvedValue(
      buildRunningSnapshot("2026-05-25", "2026-05-31"),
    );
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("defaults to the current week when no week query is present", async () => {
    const { default: DashboardPage } = await import(
      "../../src/app/(app-shell)/dashboard/page"
    );

    const element = await DashboardPage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);

    expectSelectedSnapshotDate("2026-05-25");
    expect(html).toContain('data-title="This Week"');
    expect(html).toContain('data-previous="/dashboard?week=2026-05-18"');
    expect(html).toContain('data-next="none"');
    expect(html).toContain('data-is-current="true"');
  });

  it("renders a URL-selected prior week with previous and next links", async () => {
    vi.mocked(dashboardStravaModule.getDashboardRunningSnapshot).mockResolvedValue(
      buildRunningSnapshot("2026-05-18", "2026-05-24"),
    );
    const { default: DashboardPage } = await import(
      "../../src/app/(app-shell)/dashboard/page"
    );

    const element = await DashboardPage({
      searchParams: Promise.resolve({ week: "2026-05-18" }),
    });
    const html = renderToStaticMarkup(element);

    expectSelectedSnapshotDate("2026-05-18");
    expect(html).toContain('data-title="Selected Week"');
    expect(html).toContain('data-subtitle="May 18 - 24"');
    expect(html).toContain('data-previous="/dashboard?week=2026-05-11"');
    expect(html).toContain('data-next="/dashboard"');
    expect(html).toContain('data-is-current="false"');
  });

  it("clamps future week query values to the current week", async () => {
    const { default: DashboardPage } = await import(
      "../../src/app/(app-shell)/dashboard/page"
    );

    await DashboardPage({
      searchParams: Promise.resolve({ week: "2026-06-08" }),
    });

    expectSelectedSnapshotDate("2026-05-25");
  });
});

function expectSelectedSnapshotDate(dateOnly: string): void {
  const selectedDate = vi.mocked(
    dashboardStravaModule.getDashboardRunningSnapshot,
  ).mock.calls.at(-1)?.[1];

  expect(selectedDate).toBeInstanceOf(Date);
  expect(
    `${selectedDate?.getFullYear()}-${String(
      (selectedDate?.getMonth() ?? -1) + 1,
    ).padStart(2, "0")}-${String(selectedDate?.getDate()).padStart(2, "0")}`,
  ).toBe(dateOnly);
}

function buildRunningSnapshot(weekStartDate: string, weekEndDate: string) {
  return {
    weekStartDate,
    weekEndDate,
    runCount: 0,
    totalDistanceMeters: 0,
    totalMovingTimeSeconds: 0,
    totalElevationGain: 0,
    averagePaceSecondsPerMile: null,
    averageCadence: null,
    averageHeartrate: null,
    averagePowerWatts: null,
    distanceSeriesMiles: [],
    movingTimeSeriesMinutes: [],
    elevationSeriesFeet: [],
    paceSeriesSecondsPerMile: [],
    cadenceSeries: [],
    heartrateSeries: [],
    powerSeries: [],
    recentRun: null,
    longestRun: null,
  };
}
