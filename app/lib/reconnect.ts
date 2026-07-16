import type { StoredSession } from "./session";

// Fire a resume on a dead socket when the tab regains foreground or the network returns.
// Mobile backgrounding suspends the page and closes the WebSocket without reloading, so the
// mount-time resume never replays.

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
