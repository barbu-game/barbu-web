import { describe, expect, it } from "vitest";
import { buildPodWsUrl } from "./redirect";
import { resolveWsUrl } from "./wsUrl";

describe("resolveWsUrl", () => {
  it("uses the configured url when set", () => {
    expect(resolveWsUrl("ws://localhost:8080/ws/game", { protocol: "http:", host: "localhost:3000" })).toBe(
      "ws://localhost:8080/ws/game",
    );
  });

  it("derives a secure socket on the page's host behind https", () => {
    expect(resolveWsUrl(undefined, { protocol: "https:", host: "barbu.example.com" })).toBe(
      "wss://barbu.example.com/ws/game",
    );
  });

  it("derives a plain socket over http, keeping the port", () => {
    expect(resolveWsUrl(undefined, { protocol: "http:", host: "192.168.1.20:3000" })).toBe(
      "ws://192.168.1.20:3000/ws/game",
    );
  });

  it("treats an empty build-time value as unset", () => {
    expect(resolveWsUrl("", { protocol: "https:", host: "barbu.example.com" })).toBe("wss://barbu.example.com/ws/game");
  });

  it("yields an absolute url that pod routing can rewrite", () => {
    const base = resolveWsUrl(undefined, { protocol: "https:", host: "barbu.example.com" });
    expect(buildPodWsUrl(base, "barbu-server-1")).toBe("wss://barbu.example.com/pod/barbu-server-1/ws/game");
  });
});
