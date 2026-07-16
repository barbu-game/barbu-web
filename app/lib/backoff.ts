// Delay before the next reconnection attempt. Full jitter (random delay within an exponentially
// growing window) avoids a thundering herd: a pod restart disconnects every client at once, so a
// deterministic delay would re-saturate the server in lockstep. The floor avoids hammering instantly.
const FLOOR_MS = 500;
const BASE_MS = 1000;
const CAP_MS = 15000;

export function nextBackoffDelay(attempt: number, rng: () => number = Math.random): number {
  const window = Math.min(CAP_MS, BASE_MS * 2 ** attempt);
  return FLOOR_MS + rng() * window;
}
