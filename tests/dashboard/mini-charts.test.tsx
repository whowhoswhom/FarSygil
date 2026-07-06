import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { MiniLineChart } from "../../src/components/dashboard/mini-line-chart";
import { MiniBarChart } from "../../src/components/dashboard/mini-bar-chart";

describe("dashboard mini charts", () => {
  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("does not render a trend line for fewer than two real points", () => {
    expect(renderToStaticMarkup(<MiniLineChart values={[]} tone="distance" />)).toBe(
      "",
    );
    expect(
      renderToStaticMarkup(<MiniLineChart values={[42]} tone="distance" />),
    ).toBe("");
  });

  it("renders a line chart once at least two real points exist", () => {
    const html = renderToStaticMarkup(
      <MiniLineChart values={[10, 20]} tone="distance" />,
    );

    expect(html).toContain("<svg");
    expect(html).toContain("<path");
  });

  it("renders a single honest bar for one real daily value", () => {
    // A bar chart plots discrete daily totals; one real day is honest, not a
    // fabricated trend, so it must still render.
    const html = renderToStaticMarkup(
      <MiniBarChart values={[1200]} tone="distance" />,
    );

    expect(html).toContain("<rect");
  });

  it("renders nothing for an empty bar series", () => {
    expect(renderToStaticMarkup(<MiniBarChart values={[]} tone="distance" />)).toBe(
      "",
    );
  });
});
