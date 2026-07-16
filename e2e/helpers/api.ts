import type { APIRequestContext, BrowserContext } from "@playwright/test";

const API = "http://localhost:8080";

export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export async function register(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<Record<string, unknown>> {
  const res = await request.post(`${API}/auth/register`, { data: { username, password } });
  if (!res.ok()) throw new Error(`register failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** Injects the session (register/login response) as-is under the frontend's key. */
export async function seedAuth(context: BrowserContext, auth: Record<string, unknown>) {
  await context.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    ["barbu.auth", JSON.stringify(auth)] as const,
  );
}
