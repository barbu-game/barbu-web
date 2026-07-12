export type SeatPosition = { seat: number; topPct: number; leftPct: number };

// Sièges placés sur une ellipse. Angle 90° (bas) = votre siège ; les autres suivent dans
// le sens horaire. Rayons < 50 pour garder les tuiles à l'intérieur de la boîte.
const RX = 46;
const RY = 42;

export function seatLayout(count: number, yourSeat: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  for (let i = 0; i < count; i++) {
    const offset = (i - yourSeat + count) % count;
    const angle = Math.PI / 2 + (offset / count) * 2 * Math.PI; // 90° = bas
    positions.push({
      seat: i,
      leftPct: 50 + RX * Math.cos(angle),
      topPct: 50 + RY * Math.sin(angle),
    });
  }
  return positions;
}
