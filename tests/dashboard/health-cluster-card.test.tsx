import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { DashboardHealthClusterCard } from "../../src/components/visual-reboot";

describe("DashboardHealthClusterCard", () => {
  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("supports dense health-page clusters without adding fake metric columns", () => {
    const html = renderToStaticMarkup(
      <DashboardHealthClusterCard
        title="Daily Signals"
        sourceLabel="Apple Health"
        hint="Missing signals stay empty."
        metrics={[
          {
            label: "Sleep",
            tone: "recovery",
            icon: "recovery",
            value: "7.4",
            unit: "hr",
          },
          {
            label: "Steps",
            tone: "distance",
            icon: "runs",
            value: "8,572",
            unit: "count",
          },
        ]}
      />,
    );

    expect(html).toContain("Daily Signals");
    expect(html).toContain("Sleep");
    expect(html).toContain("Steps");
    expect(html).toContain("repeat(2, minmax(0, 1fr))");
    expect(html).not.toContain("Activity Rings");
    expect(html).not.toContain("Move");
    expect(html).not.toContain("Calories");
  });
});
