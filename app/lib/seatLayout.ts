export type SeatPosition = { seat: number; topPct: number; leftPct: number };

// Seats sit on an ellipse. Angle 90° (bottom) is your seat; the others follow clockwise.
// Radii < 50 keep the tiles inside the box.
const RX = 46;
const RY = 42;

/** Angle (radians, y pointing down) of `seat` around the table, with your seat at the bottom. */
export function seatAngle(seat: number, count: number, yourSeat: number): number {
  const offset = (seat - yourSeat + count) % count;
  return Math.PI / 2 + (offset / count) * 2 * Math.PI;
}

export function seatLayout(count: number, yourSeat: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  for (let i = 0; i < count; i++) {
    const angle = seatAngle(i, count, yourSeat);
    positions.push({
      seat: i,
      leftPct: 50 + RX * Math.cos(angle),
      topPct: 50 + RY * Math.sin(angle),
    });
  }
  return positions;
}
