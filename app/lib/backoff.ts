// Delay before the next reconnection attempt. Full jitter (a random delay within an
// exponentially growing window) to avoid the thundering herd: when a pod restarts, all clients
// disconnected at the same instant; a deterministic delay would make them retry simultaneously
// and re-saturate the server. The floor avoids hammering instantly.
const FLOOR_MS = 500;
const BASE_MS = 1000;
const CAP_MS = 15000;

export function nextBackoffDelay(attempt: number, rng: () => number = Math.random): number {
  const window = Math.min(CAP_MS, BASE_MS * 2 ** attempt);
  return FLOOR_MS + rng() * window;
}
