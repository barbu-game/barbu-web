import { describe, expect, it } from "vitest";
import { deriveConnectionPhase } from "./connectionPhase";

describe("deriveConnectionPhase", () => {
  it("shows nothing when there is no active game session", () => {
    expect(deriveConnectionPhase({ isOpen: false, hasSession: false, resumeUnavailable: false })).toBe("connected");
    expect(deriveConnectionPhase({ isOpen: false, hasSession: false, resumeUnavailable: true })).toBe("connected");
  });

  it("is connected when the socket is open during a game", () => {
    expect(deriveConnectionPhase({ isOpen: true, hasSession: true, resumeUnavailable: false })).toBe("connected");
  });

  it("is connected when the socket is open even if a stale resumeUnavailable is latched", () => {
    expect(deriveConnectionPhase({ isOpen: true, hasSession: true, resumeUnavailable: true })).toBe("connected");
  });

  it("is reconnecting when the socket is down during a game", () => {
    expect(deriveConnectionPhase({ isOpen: false, hasSession: true, resumeUnavailable: false })).toBe("reconnecting");
  });

  it("is failed when the server refuses the resume", () => {
    expect(deriveConnectionPhase({ isOpen: false, hasSession: true, resumeUnavailable: true })).toBe("failed");
  });
});
