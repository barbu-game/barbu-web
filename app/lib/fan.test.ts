import { describe, expect, it } from "vitest";
import { fanLayout } from "./fan";

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
