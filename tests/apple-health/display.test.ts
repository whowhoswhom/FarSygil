import { describe, expect, it } from "vitest";

import {
  buildAppleHealthDashboardMetrics,
  getAppleHealthDashboardMetricTypes,
} from "../../src/lib/apple-health/display";
import type { AppleHealthMetricSnapshot } from "../../src/server/apple-health/queries";

describe("Apple Health display helpers", () => {
  it("uses the shared dashboard metric order and VO2 label", () => {
    expect(getAppleHealthDashboardMetricTypes()).toEqual([
      "vo2_max",
      "resting_hr",
      "hrv",
      "sleep_hours",
      "steps",
    ]);

    expect(buildAppleHealthDashboardMetrics([])[0]).toMatchObject({
      label: "VO₂ Max",
      value: undefined,
      unit: undefined,
    });
  });

  it("does not render units beside inline missing values", () => {
    const metrics = buildAppleHealthDashboardMetrics([
      {
        date: "2026-05-16",
        metricType: "sleep_hours",
        value: null,
        unit: "hr",
        source: "AppleHealth",
      },
    ] satisfies AppleHealthMetricSnapshot[]);

    expect(metrics.find((metric) => metric.label === "Sleep")).toMatchObject({
      value: "--",
      unit: undefined,
    });
  });
});
