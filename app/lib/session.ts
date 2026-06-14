"use client";

// Persiste la session de jeu en cours (room + siège + resume token) pour permettre la reprise
// après un refresh. Le token de login, lui, est déjà persisté par useAuth (lib/auth.ts) — on ne
// duplique pas ici.

const SESSION_KEY = "barbu.session";

export type StoredSession = { roomId: string; seat: number; resumeToken: string };

export function saveSession(s: StoredSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // localStorage indisponible (mode privé) — la reconnexion sera simplement impossible
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
