export type ConnectionPhase = "connected" | "reconnecting" | "failed";

// "Stable" phase that drives the connection toast. Retry never gives up while the tab is open, so
// we only switch to `failed` when the server explicitly refuses the resume (`resumeUnavailable`:
// game over / seat taken).
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
