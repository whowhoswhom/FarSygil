import { describe, expect, it } from "vitest";

import {
  DESKTOP_ITEMS,
  MOBILE_ITEMS,
} from "../../src/components/app-shell/app-shell";

describe("app shell navigation model", () => {
  it("exposes Archive on desktop but keeps mobile navigation at five items", () => {
    expect(DESKTOP_ITEMS.map((item) => item.href)).toContain("/archive");
    expect(MOBILE_ITEMS.map((item) => item.href)).not.toContain("/archive");
    expect(MOBILE_ITEMS).toHaveLength(5);
  });
});
