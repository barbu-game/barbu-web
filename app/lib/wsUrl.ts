/**
 * Game socket URL. An explicit NEXT_PUBLIC_WS_URL wins; otherwise the socket lives on the page's
 * own host, so one image serves any domain. Always absolute: buildPodWsUrl parses it with new URL().
 */
export function resolveWsUrl(configured: string | undefined, location: { protocol: string; host: string }): string {
  if (configured) return configured;
  const scheme = location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${location.host}/ws/game`;
}

/** Reads window, so call it from event handlers/effects only — never at module scope (prerender runs on the server). */
export const gameWsUrl = () => resolveWsUrl(process.env.NEXT_PUBLIC_WS_URL, window.location);
