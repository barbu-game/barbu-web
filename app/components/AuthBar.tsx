"use client";

import { useState } from "react";
import { login, register, setAuth, useAuth } from "../lib/auth";

export default function AuthBar() {
  const auth = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      setAuth(await (mode === "login" ? login : register)({ username, password }));
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => setAuth(null);

  if (auth) {
    return (
      <div className="mx-auto mt-6 flex w-full max-w-md items-center justify-between rounded-xl bg-slate-900/60 px-4 py-2 text-sm ring-1 ring-white/10">
        <span className="text-slate-300">
          Signed in as <b className="text-emerald-300">{auth.username}</b>
        </span>
        <button onClick={logout} className="text-slate-400 underline hover:text-white">
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md rounded-xl bg-slate-900/60 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex gap-2 text-sm">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={mode === m ? "font-semibold text-emerald-300" : "text-slate-400"}
          >
            {m === "login" ? "Log in" : "Register"}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">optional — or play as guest</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          maxLength={40}
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="password"
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
        />
        <button
          onClick={submit}
          disabled={busy || !username || !password}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {mode === "login" ? "Log in" : "Register"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
