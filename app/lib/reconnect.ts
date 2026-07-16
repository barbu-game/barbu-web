import type { StoredSession } from "./session";

// Session resume when the tab comes back to the foreground or the network reappears.
// On mobile, leaving the tab (e.g. to share the invite link) suspends the page and closes the
// WebSocket. If the tab is not reloaded on return, the mount-time resume never replays: so we
// listen to visibilitychange/online to fire a `resume` on a dead socket.

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
