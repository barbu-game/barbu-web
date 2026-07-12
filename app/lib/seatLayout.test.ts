import { describe, expect, it } from "vitest";
import { seatLayout } from "./seatLayout";

describe("seatLayout", () => {
  it("returns one position per seat for 2..10 players", () => {
    for (let n = 2; n <= 10; n++) {
      const positions = seatLayout(n, 0);
      expect(positions).toHaveLength(n);
      expect(new Set(positions.map((p) => p.seat)).size).toBe(n);
    }
  });

  it("places your seat at the bottom center", () => {
    const positions = seatLayout(5, 2);
    const you = positions.find((p) => p.seat === 2)!;
    expect(you.leftPct).toBeCloseTo(50, 0);
    expect(you.topPct).toBeGreaterThan(80);
  });

  it("keeps all positions within the 0..100 box", () => {
    for (let n = 2; n <= 10; n++) {
      for (const p of seatLayout(n, 0)) {
        expect(p.topPct).toBeGreaterThanOrEqual(0);
        expect(p.topPct).toBeLessThanOrEqual(100);
        expect(p.leftPct).toBeGreaterThanOrEqual(0);
        expect(p.leftPct).toBeLessThanOrEqual(100);
      }
    }
  });
});
