import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { RoutePreview } from "../../src/components/activities/route-preview";

describe("RoutePreview", () => {
  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("renders distance-only route chips and real path endpoint markers", () => {
    const html = renderToStaticMarkup(
      <RoutePreview
        activityId={9001}
        pathData="M10 20 L44 88 L150 170"
        chipLabel="12.00 mi"
      />,
    );

    expect(html).toContain("12.00 mi");
    expect(html).not.toContain("Route detail");
    expect(html).toContain('cx="10"');
    expect(html).toContain('cy="20"');
    expect(html).toContain('cx="150"');
    expect(html).toContain('cy="170"');
    expect(html).not.toContain('cx="32"');
    expect(html).not.toContain('cx="166"');
  });
});
