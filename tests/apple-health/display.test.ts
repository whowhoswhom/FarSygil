import { describe, expect, it } from "vitest";

import {
  APPLE_HEALTH_DAILY_SIGNAL_METRIC_TYPES,
  APPLE_HEALTH_VITALS_METRIC_TYPES,
  buildAppleHealthDashboardMetrics,
  buildAppleHealthMetricGroup,
  getAppleHealthDashboardMetricTypes,
} from "../../src/lib/apple-health/display";
import type { AppleHealthMetricSnapshot } from "../../src/server/apple-health/queries";

describe("Apple Health display helpers", () => {
  it("splits Vitals and Daily Signals by explicit metric type, not array index", () => {
    const vitals = buildAppleHealthMetricGroup(
      [],
      [],
      APPLE_HEALTH_VITALS_METRIC_TYPES,
    );
    const signals = buildAppleHealthMetricGroup(
      [],
      [],
      APPLE_HEALTH_DAILY_SIGNAL_METRIC_TYPES,
    );

    expect(vitals.map((metric) => metric.label)).toEqual([
      "VO₂ Max",
      "Resting HR",
      "HRV",
    ]);
    expect(signals.map((metric) => metric.label)).toEqual(["Sleep", "Steps"]);

    // The two clusters together must cover the full dashboard set with no
    // overlap, so no metric is dropped or double-counted by the split.
    expect([
      ...APPLE_HEALTH_VITALS_METRIC_TYPES,
      ...APPLE_HEALTH_DAILY_SIGNAL_METRIC_TYPES,
    ].sort()).toEqual([...getAppleHealthDashboardMetricTypes()].sort());
  });

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

  it("attaches chart values only when a metric has at least two trend points", () => {
    const metrics = buildAppleHealthDashboardMetrics(
      [
        {
          date: "2026-05-16",
          metricType: "resting_hr",
          value: 53,
          unit: "bpm",
          source: "AppleHealth",
        },
        {
          date: "2026-05-16",
          metricType: "hrv",
          value: 68,
          unit: "ms",
          source: "AppleHealth",
        },
      ],
      [
        {
          metricType: "resting_hr",
          points: [
            {
              date: "2026-05-15",
              value: 55,
            },
            {
              date: "2026-05-16",
              value: 53,
            },
          ],
        },
        {
          metricType: "hrv",
          points: [
            {
              date: "2026-05-16",
              value: 68,
            },
          ],
        },
      ],
    );

    expect(metrics.find((metric) => metric.label === "Resting HR")).toMatchObject({
      chartValues: [55, 53],
    });
    expect(metrics.find((metric) => metric.label === "HRV")).not.toHaveProperty(
      "chartValues",
    );
  });
});
