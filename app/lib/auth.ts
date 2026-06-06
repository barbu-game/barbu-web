import type { AuthControllerCredentials } from "./api/barbu";

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
