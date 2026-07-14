// Délai avant la prochaine tentative de reconnexion. Full jitter (delai aléatoire dans une
// fenêtre qui croît exponentiellement) pour éviter le thundering herd : quand un pod redémarre,
// tous les clients se sont déconnectés au même instant ; un délai déterministe les ferait
// retenter en même temps et re-saturer le serveur. Le plancher évite de marteler instantanément.
const FLOOR_MS = 500;
const BASE_MS = 1000;
const CAP_MS = 15000;

export function nextBackoffDelay(attempt: number, rng: () => number = Math.random): number {
  const window = Math.min(CAP_MS, BASE_MS * 2 ** attempt);
  return FLOOR_MS + rng() * window;
}
