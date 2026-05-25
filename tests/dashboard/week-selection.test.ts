import { describe, expect, it } from "vitest";

import {
  dashboardWeekDateFromDateOnly,
  getDashboardWeekHref,
  resolveDashboardWeekSelection,
} from "../../src/lib/dashboard/week-selection";

describe("dashboard week selection", () => {
  it("defaults to the current Monday-anchored week", () => {
    const selection = resolveDashboardWeekSelection(
      undefined,
      new Date("2026-05-27T12:00:00.000Z"),
    );

    expect(selection).toEqual({
      selectedWeekStartDate: "2026-05-25",
      currentWeekStartDate: "2026-05-25",
      previousWeekStartDate: "2026-05-18",
      nextWeekStartDate: null,
      isCurrentWeek: true,
    });
  });

  it("normalizes a prior-week URL value to its Monday week start", () => {
    const selection = resolveDashboardWeekSelection(
      "2026-05-20",
      new Date("2026-05-27T12:00:00.000Z"),
    );

    expect(selection).toMatchObject({
      selectedWeekStartDate: "2026-05-18",
      currentWeekStartDate: "2026-05-25",
      previousWeekStartDate: "2026-05-11",
      nextWeekStartDate: "2026-05-25",
      isCurrentWeek: false,
    });
  });

  it("clamps future weeks back to the current week", () => {
    const selection = resolveDashboardWeekSelection(
      "2026-06-08",
      new Date("2026-05-27T12:00:00.000Z"),
    );

    expect(selection.selectedWeekStartDate).toBe("2026-05-25");
    expect(selection.nextWeekStartDate).toBeNull();
    expect(selection.isCurrentWeek).toBe(true);
  });

  it("builds shareable dashboard week links while keeping current week canonical", () => {
    expect(getDashboardWeekHref("2026-05-18", "2026-05-25")).toBe(
      "/dashboard?week=2026-05-18",
    );
    expect(getDashboardWeekHref("2026-05-25", "2026-05-25")).toBe(
      "/dashboard",
    );
  });

  it("creates a stable local midday date for dashboard snapshots", () => {
    const date = dashboardWeekDateFromDateOnly("2026-05-18");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(18);
    expect(date.getHours()).toBe(12);
  });
});
