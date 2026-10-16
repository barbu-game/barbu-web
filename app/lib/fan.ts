export type Fan = { rows: number; perRow: number; step: number };

/**
 * Lays out `count` overlapping cards of width `cardWidth` within `available` px: the step between
 * card origins shrinks until the row fits, never exceeding `maxStep`. When the step would drop
 * below `minStep` (too thin to tap), the hand is split over two rows instead.
 */
export function fanLayout(count: number, cardWidth: number, available: number, maxStep: number, minStep: number): Fan {
  if (count <= 0) return { rows: 1, perRow: 0, step: 0 };
  const fit = (n: number) => (n <= 1 ? maxStep : Math.min(maxStep, (available - cardWidth) / (n - 1)));
  const single = fit(count);
  if (single >= minStep) return { rows: 1, perRow: count, step: Math.max(0, single) };
  const perRow = Math.ceil(count / 2);
  return { rows: 2, perRow, step: Math.max(0, fit(perRow)) };
}

/** Slot under (`x`, `y`) in a hand laid out by {@link fanLayout}, measured from the hand's top-left. */
export function fanIndexAt(
  x: number,
  y: number,
  fan: Fan,
  geo: { count: number; cardWidth: number; width: number; top: number; rowOffset: number },
): number {
  const row = fan.rows === 2 && y >= geo.top + geo.rowOffset ? 1 : 0;
  const rowCount = row ? geo.count - fan.perRow : Math.min(fan.perRow, geo.count);
  const left = (geo.width - (geo.cardWidth + (rowCount - 1) * fan.step)) / 2;
  const inRow = fan.step > 0 ? Math.floor((x - left) / fan.step) : 0;
  return row * fan.perRow + Math.max(0, Math.min(rowCount - 1, inRow));
}
