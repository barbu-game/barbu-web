import { describe, expect, it, vi } from "vitest";
import { createRetryScheduler, type RetrySchedulerDeps } from "./retryLoop";
import type { StoredSession } from "./session";

const SESSION: StoredSession = { roomId: "4URC3", seat: 0, resumeToken: "tok-123" };

// Fake timer scheduler: captures the callbacks to fire them by hand.
function fakeTimers() {
  const pending = new Map<number, () => void>();
  let next = 1;
  const setTimer = (cb: () => void) => {
    const id = next++;
    pending.set(id, cb);
    return id;
  };
  const clearTimer = (id: number) => {
    pending.delete(id);
  };
  const runOldest = () => {
    const [id, cb] = [...pending.entries()][0];
    pending.delete(id);
    cb();
  };
  return { setTimer, clearTimer, runOldest, size: () => pending.size };
}

function setup(overrides: Partial<RetrySchedulerDeps> = {}) {
  const timers = fakeTimers();
  const resume = vi.fn();
  const delayFor = vi.fn((attempt: number) => attempt); // delay = attempt number
  const deps: RetrySchedulerDeps = {
    loadSession: () => SESSION,
    resume,
    isSocketOpen: () => false,
    delayFor,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    ...overrides,
  };
  return { scheduler: createRetryScheduler(deps), timers, resume, delayFor };
}

describe("createRetryScheduler", () => {
  it("schedules a resume with the stored token when the socket closes", () => {
    const { scheduler, timers, resume } = setup();
    scheduler.onClosed();
    expect(timers.size()).toBe(1);
    timers.runOldest();
    expect(resume).toHaveBeenCalledWith("tok-123");
  });

  it("does nothing when there is no stored session", () => {
    const { scheduler, timers } = setup({ loadSession: () => null });
    scheduler.onClosed();
    expect(timers.size()).toBe(0);
  });

  it("does not resume if the socket reopened before the timer fired", () => {
    let open = false;
    const { scheduler, timers, resume } = setup({ isSocketOpen: () => open });
    scheduler.onClosed();
    open = true;
    timers.runOldest();
    expect(resume).not.toHaveBeenCalled();
  });

  it("retries indefinitely with a growing attempt index across successive closes", () => {
    const { scheduler, timers, delayFor } = setup();
    scheduler.onClosed(); // attempt 0
    timers.runOldest();   // resume fails -> socket closes again
    scheduler.onClosed(); // attempt 1
    timers.runOldest();
    scheduler.onClosed(); // attempt 2
    expect(delayFor.mock.calls.map((c) => c[0])).toEqual([0, 1, 2]);
  });

  it("does not stack timers if onClosed fires twice for the same drop", () => {
    const { scheduler, timers } = setup();
    scheduler.onClosed();
    scheduler.onClosed();
    expect(timers.size()).toBe(1);
  });

  it("resets the attempt index and cancels the pending timer on open", () => {
    const { scheduler, timers, delayFor } = setup();
    scheduler.onClosed(); // attempt 0
    scheduler.onOpen();   // socket recovered -> cancel + reset
    expect(timers.size()).toBe(0);
    scheduler.onClosed(); // attempt back to 0
    expect(delayFor.mock.calls.map((c) => c[0])).toEqual([0, 0]);
  });

  it("cancels the pending timer on stop", () => {
    const { scheduler, timers } = setup();
    scheduler.onClosed();
    scheduler.stop();
    expect(timers.size()).toBe(0);
  });
});
