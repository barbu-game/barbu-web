import type { StoredSession } from "./session";

// Reprise de session quand l'onglet revient au premier plan ou que le réseau réapparaît.
// Sur mobile, quitter l'onglet (p. ex. pour partager le lien d'invitation) suspend la page et
// ferme le WebSocket. Si l'onglet n'est pas rechargé au retour, la reprise au montage ne rejoue
// jamais : on écoute donc visibilitychange/online pour relancer un `resume` sur socket mort.

export type ReconnectDeps = {
  isVisible: () => boolean;
  isSocketOpen: () => boolean;
  loadSession: () => StoredSession | null;
  resume: (token: string) => void;
};

export function installReconnect(deps: ReconnectDeps): () => void {
  const attempt = () => {
    if (!deps.isVisible()) return;
    if (deps.isSocketOpen()) return;
    const stored = deps.loadSession();
    if (!stored) return;
    deps.resume(stored.resumeToken);
  };

  document.addEventListener("visibilitychange", attempt);
  window.addEventListener("online", attempt);

  return () => {
    document.removeEventListener("visibilitychange", attempt);
    window.removeEventListener("online", attempt);
  };
}
