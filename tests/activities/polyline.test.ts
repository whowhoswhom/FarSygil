import { describe, expect, it } from "vitest";
import {
  buildNormalizedRoutePath,
  decodePolyline,
} from "../../src/lib/activities/polyline";

describe("polyline helpers", () => {
  it("decodes the canonical Google polyline example", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ]);
  });

  it("normalizes decoded points into an SVG path", () => {
    expect(buildNormalizedRoutePath("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toMatch(
      /^M\d+\.\d{2} \d+\.\d{2} L\d+\.\d{2} \d+\.\d{2} L\d+\.\d{2} \d+\.\d{2}$/,
    );
  });

  it("returns null for empty or degenerate polylines", () => {
    expect(buildNormalizedRoutePath("")).toBeNull();
    expect(buildNormalizedRoutePath("??")).toBeNull();
  });
});
