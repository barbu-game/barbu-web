import { afterEach, describe, expect, it, vi } from "vitest";
import { installReconnect, type ReconnectDeps } from "./reconnect";
import type { StoredSession } from "./session";

const SESSION: StoredSession = { roomId: "4URC3", seat: 0, resumeToken: "tok-123" };

function setup(overrides: Partial<ReconnectDeps> = {}) {
  const resume = vi.fn();
  const deps: ReconnectDeps = {
    isVisible: () => true,
    isSocketOpen: () => false,
    loadSession: () => SESSION,
    resume,
    ...overrides,
  };
  const cleanup = installReconnect(deps);
  return { resume, cleanup };
}

function fireVisibilityChange() {
  document.dispatchEvent(new Event("visibilitychange"));
}

function fireOnline() {
  window.dispatchEvent(new Event("online"));
}

describe("installReconnect", () => {
  let cleanups: Array<() => void> = [];
  afterEach(() => {
    cleanups.forEach((c) => c());
    cleanups = [];
  });

  it("resumes with the stored token when the page becomes visible and the socket is dead", () => {
    const { resume, cleanup } = setup();
    cleanups.push(cleanup);

    fireVisibilityChange();

    expect(resume).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledWith("tok-123");
  });

  it("does not resume when the socket is still open", () => {
    const { resume, cleanup } = setup({ isSocketOpen: () => true });
    cleanups.push(cleanup);

    fireVisibilityChange();

    expect(resume).not.toHaveBeenCalled();
  });

  it("does not resume while the page is hidden", () => {
    const { resume, cleanup } = setup({ isVisible: () => false });
    cleanups.push(cleanup);

    fireVisibilityChange();

    expect(resume).not.toHaveBeenCalled();
  });

  it("does not resume when there is no stored session", () => {
    const { resume, cleanup } = setup({ loadSession: () => null });
    cleanups.push(cleanup);

    fireVisibilityChange();

    expect(resume).not.toHaveBeenCalled();
  });

  it("also reconnects on the browser 'online' event", () => {
    const { resume, cleanup } = setup();
    cleanups.push(cleanup);

    fireOnline();

    expect(resume).toHaveBeenCalledWith("tok-123");
  });

  it("stops reacting after cleanup", () => {
    const { resume, cleanup } = setup();
    cleanup();

    fireVisibilityChange();
    fireOnline();

    expect(resume).not.toHaveBeenCalled();
  });
});
