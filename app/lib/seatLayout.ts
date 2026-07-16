export type SeatPosition = { seat: number; topPct: number; leftPct: number };

// Seats placed on an ellipse. Angle 90° (bottom) = your seat; the others follow clockwise.
// Radii < 50 to keep the tiles inside the box.
const RX = 46;
const RY = 42;

export function seatLayout(count: number, yourSeat: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  for (let i = 0; i < count; i++) {
    const offset = (i - yourSeat + count) % count;
    const angle = Math.PI / 2 + (offset / count) * 2 * Math.PI; // 90° = bottom
    positions.push({
      seat: i,
      leftPct: 50 + RX * Math.cos(angle),
      topPct: 50 + RY * Math.sin(angle),
    });
  }
  return positions;
}
