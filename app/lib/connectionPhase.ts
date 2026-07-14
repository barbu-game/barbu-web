export type ConnectionPhase = "connected" | "reconnecting" | "failed";

// Phase « stable » qui pilote le toast de connexion. Le retry ne s'épuisant jamais tant que
// l'onglet est ouvert, on ne bascule en `failed` que quand le serveur refuse explicitement la
// reprise (`resumeUnavailable` : partie finie / siège pris) — sinon on reste en `reconnecting`.
export function deriveConnectionPhase(input: {
  isOpen: boolean;
  hasSession: boolean;
  resumeUnavailable: boolean;
}): ConnectionPhase {
  if (!input.hasSession) return "connected";
  // Un socket ouvert prime : `resumeUnavailable` reste armé après une reprise refusée, or une
  // session ouverte après coup (nouvelle table) est bel et bien connectée.
  if (input.isOpen) return "connected";
  if (input.resumeUnavailable) return "failed";
  return "reconnecting";
}
