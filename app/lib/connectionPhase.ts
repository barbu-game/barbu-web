export type ConnectionPhase = "connected" | "reconnecting" | "failed";

// "Stable" phase that drives the connection toast. Since the retry never gives up while the tab
// is open, we only switch to `failed` when the server explicitly refuses the resume
// (`resumeUnavailable`: game over / seat taken) — otherwise we stay in `reconnecting`.
export function deriveConnectionPhase(input: {
  isOpen: boolean;
  hasSession: boolean;
  resumeUnavailable: boolean;
}): ConnectionPhase {
  if (!input.hasSession) return "connected";
  // An open socket wins: `resumeUnavailable` stays armed after a refused resume, yet a session
  // opened afterwards (new table) is genuinely connected.
  if (input.isOpen) return "connected";
  if (input.resumeUnavailable) return "failed";
  return "reconnecting";
}
