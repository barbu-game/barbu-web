// Routage par table : le serveur peut répondre `{type:"redirect", roomId, pod}` quand la partie
// vit sur un autre pod (state relocalisé). On se reconnecte au pod propriétaire via un préfixe de
// chemin `/pod/<pod>` que Traefik route vers le service de ce pod (pas de DNS par pod requis).

export function buildPodWsUrl(baseUrl: string, pod: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/pod/${pod}${url.pathname}`;
  return url.toString();
}
