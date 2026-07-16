// The server redirects to another pod when the game's state has relocated there. Reconnect via a
// `/pod/<pod>` path prefix that Traefik routes to that pod's service (no per-pod DNS required).

export function buildPodWsUrl(baseUrl: string, pod: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/pod/${pod}${url.pathname}`;
  return url.toString();
}
