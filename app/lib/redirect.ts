// Per-table routing: the server may reply `{type:"redirect", roomId, pod}` when the game lives on
// another pod (relocated state). We reconnect to the owning pod via a `/pod/<pod>` path prefix
// that Traefik routes to that pod's service (no per-pod DNS required).

export function buildPodWsUrl(baseUrl: string, pod: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/pod/${pod}${url.pathname}`;
  return url.toString();
}
