import { useSyncExternalStore } from "react";
import type { AuthControllerCredentials } from "@barbu-game/barbu-api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type AuthResult = { token: string; username: string };

async function post(path: string, body: AuthControllerCredentials): Promise<AuthResult> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export const login = (credentials: AuthControllerCredentials) => post("/auth/login", credentials);
export const register = (credentials: AuthControllerCredentials) => post("/auth/register", credentials);

// Session persistence: the auth result is mirrored into localStorage so a page refresh
// keeps the user signed in. Exposed as a useSyncExternalStore-backed hook — this reads
// storage without a hydration mismatch (server snapshot is null) and stays in sync across
// tabs via the `storage` event.
const STORAGE_KEY = "barbu.auth";
const listeners = new Set<() => void>();

let snapshot: AuthResult | null = null;
let parsedFrom: string | null = null;

function getSnapshot(): AuthResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  // Re-parse only when the stored string changed, so getSnapshot returns a stable reference.
  if (raw === parsedFrom) return snapshot;
  parsedFrom = raw;
  if (!raw) return (snapshot = null);
  try {
    return (snapshot = JSON.parse(raw) as AuthResult);
  } catch {
    // Corrupt entry (hand-edited or partial write): drop it so the user lands clean.
    window.localStorage.removeItem(STORAGE_KEY);
    parsedFrom = null;
    return (snapshot = null);
  }
}

function getServerSnapshot(): AuthResult | null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setAuth(auth: AuthResult | null): void {
  if (typeof window === "undefined") return;
  if (auth) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  else window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((notify) => notify());
}

export function useAuth(): AuthResult | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
