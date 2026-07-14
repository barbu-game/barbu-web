import { describe, expect, it } from "vitest";
import { nextBackoffDelay } from "./backoff";

describe("nextBackoffDelay", () => {
  it("returns the floor when rng is 0 (no jitter added)", () => {
    expect(nextBackoffDelay(0, () => 0)).toBe(500);
    expect(nextBackoffDelay(5, () => 0)).toBe(500);
  });

  it("grows the jitter window exponentially with the attempt (rng = 1)", () => {
    // FLOOR + min(CAP, BASE * 2^attempt)
    expect(nextBackoffDelay(0, () => 1)).toBe(500 + 1000); // 2^0 -> 1000
    expect(nextBackoffDelay(1, () => 1)).toBe(500 + 2000); // 2^1 -> 2000
    expect(nextBackoffDelay(2, () => 1)).toBe(500 + 4000); // 2^2 -> 4000
    expect(nextBackoffDelay(3, () => 1)).toBe(500 + 8000); // 2^3 -> 8000
  });

  it("caps the jitter window at CAP_MS for large attempts", () => {
    expect(nextBackoffDelay(20, () => 1)).toBe(500 + 15000);
  });

  it("stays within [floor, floor + capped window] for a mid-range rng", () => {
    const d = nextBackoffDelay(2, () => 0.5);
    expect(d).toBeGreaterThanOrEqual(500);
    expect(d).toBeLessThanOrEqual(500 + 4000);
  });
});
