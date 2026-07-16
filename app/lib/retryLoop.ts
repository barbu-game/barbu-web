import type { StoredSession } from "./session";

export type RetryScheduler = {
  onClosed: () => void;
  onOpen: () => void;
  stop: () => void;
};

export type RetrySchedulerDeps = {
  loadSession: () => StoredSession | null;
  resume: (token: string) => void;
  isSocketOpen: () => boolean;
  delayFor: (attempt: number) => number;
  setTimer?: (cb: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
};

// Active reconnection while the tab is open: on a closed socket with a stored session, we replay
// `resume` after a growing delay (backoff + jitter, cf. delayFor). Infinite retry — never gives
// up; we only stop when there is no session or when the socket comes back (onOpen).
export function createRetryScheduler(deps: RetrySchedulerDeps): RetryScheduler {
  const setTimer = deps.setTimer ?? ((cb, ms) => setTimeout(cb, ms) as unknown as number);
  const clearTimer = deps.clearTimer ?? ((id) => clearTimeout(id));

  let attempt = 0;
  let timer: number | null = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
  };

  const fire = () => {
    timer = null;
    if (deps.isSocketOpen()) return;
    const session = deps.loadSession();
    if (!session) return;
    deps.resume(session.resumeToken);
  };

  const onClosed = () => {
    if (!deps.loadSession()) {
      cancel();
      return;
    }
    if (timer !== null) return; // an attempt is already armed for this drop
    const delay = deps.delayFor(attempt);
    attempt += 1;
    timer = setTimer(fire, delay);
  };

  const onOpen = () => {
    attempt = 0;
    cancel();
  };

  return { onClosed, onOpen, stop: cancel };
}
