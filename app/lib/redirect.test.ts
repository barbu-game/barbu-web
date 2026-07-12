import { describe, expect, it } from "vitest";
import { buildPodWsUrl } from "./redirect";

describe("buildPodWsUrl", () => {
  it("prefixes the owning pod into the ws path", () => {
    expect(buildPodWsUrl("ws://localhost:8080/ws/game", "barbu-server-2")).toBe(
      "ws://localhost:8080/pod/barbu-server-2/ws/game",
    );
  });

  it("preserves host and scheme for a secure production url", () => {
    expect(buildPodWsUrl("wss://api.barbu.kour0.com/ws/game", "barbu-server-0")).toBe(
      "wss://api.barbu.kour0.com/pod/barbu-server-0/ws/game",
    );
  });

  it("derives from the original base each time, so a second redirect does not double-prefix", () => {
    const base = "wss://api.barbu.kour0.com/ws/game";
    const first = buildPodWsUrl(base, "barbu-server-1");
    const second = buildPodWsUrl(base, "barbu-server-2");
    expect(second).toBe("wss://api.barbu.kour0.com/pod/barbu-server-2/ws/game");
    expect(first).not.toBe(second);
  });
});
