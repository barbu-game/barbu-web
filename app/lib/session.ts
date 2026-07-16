"use client";

// Persists the game session (room + seat + resume token) to allow resuming after a refresh.
// The login token is persisted separately by the auth layer, not here.

const SESSION_KEY = "barbu.session";

export type StoredSession = { roomId: string; seat: number; resumeToken: string };

export function saveSession(s: StoredSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // localStorage unavailable (private mode) — reconnection becomes impossible
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
