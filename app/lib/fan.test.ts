import { describe, expect, it } from "vitest";
import { fanIndexAt, fanLayout } from "./fan";

describe("fanLayout", () => {
  it("caps the step when there is room to spare", () => {
    expect(fanLayout(5, 80, 1000, 50, 20)).toEqual({ rows: 1, perRow: 5, step: 50 });
  });

  it("tightens the step so the row fits exactly", () => {
    const fan = fanLayout(13, 58, 358, 40, 20);
    expect(fan.rows).toBe(1);
    expect(58 + 12 * fan.step).toBeCloseTo(358);
  });

  it("splits over two rows when the cards would be too thin to tap", () => {
    const fan = fanLayout(26, 58, 358, 40, 20);
    expect(fan.rows).toBe(2);
    expect(fan.perRow).toBe(13);
    expect(58 + 12 * fan.step).toBeLessThanOrEqual(358.0001);
  });

  it("handles empty and single-card hands", () => {
    expect(fanLayout(0, 58, 300, 40, 20).perRow).toBe(0);
    expect(fanLayout(1, 58, 300, 40, 20)).toEqual({ rows: 1, perRow: 1, step: 40 });
  });
});

describe("fanIndexAt", () => {
  // 16 cards over two rows of 8: width 300, card 40, step 30 → each row is 40 + 7×30 = 250 wide.
  const fan = { rows: 2, perRow: 8, step: 30 };
  const geo = { count: 16, cardWidth: 40, width: 300, top: 10, rowOffset: 30 };

  it("maps a point on the first row to its slot", () => {
    expect(fanIndexAt(25 + 5, 20, fan, geo)).toBe(0);
    expect(fanIndexAt(25 + 3 * 30 + 5, 20, fan, geo)).toBe(3);
  });

  it("maps a point on the second row past the first row's cards", () => {
    expect(fanIndexAt(25 + 5, 10 + 30 + 20, fan, geo)).toBe(8);
    expect(fanIndexAt(299, 10 + 30 + 20, fan, geo)).toBe(15);
  });

  it("clamps points outside the hand", () => {
    expect(fanIndexAt(-50, 20, fan, geo)).toBe(0);
    expect(fanIndexAt(999, 999, fan, geo)).toBe(15);
    expect(fanIndexAt(999, 20, { rows: 1, perRow: 5, step: 30 }, { ...geo, count: 5 })).toBe(4);
  });
});
