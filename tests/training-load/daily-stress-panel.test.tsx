import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { DailyStressPanel } from "../../src/components/training-load/daily-stress-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => undefined,
  }),
}));

describe("DailyStressPanel", () => {
  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("renders recent computed days only from real daily stress rows", () => {
    const html = renderToStaticMarkup(
      <DailyStressPanel
        latest={{ date: "2026-05-12", dailyTrainingStress: 164 }}
        series={[
          { date: "2026-05-10", dailyTrainingStress: 42 },
          { date: "2026-05-11", dailyTrainingStress: 82.4 },
          { date: "2026-05-12", dailyTrainingStress: 164 },
        ]}
      />,
    );

    expect(html).toContain("Recent computed days");
    expect(html).toContain("5/12");
    expect(html).toContain("5/11");
    expect(html).toContain("5/10");
    expect(html).toContain("164");
    expect(html).toContain("82.4");
    expect(html).toContain("42.0");
    expect(html).not.toContain("Steady");
    expect(html).not.toContain("72%");
    expect(html).not.toContain("Good");
  });

  it("does not invent recent rows when daily stress is unavailable", () => {
    const html = renderToStaticMarkup(
      <DailyStressPanel latest={null} series={[]} />,
    );

    expect(html).toContain("No computed stress days yet.");
    expect(html).toContain("Data not available until at least two days");
    expect(html).not.toContain("0 stress");
    expect(html).not.toContain("Steady");
  });
});
