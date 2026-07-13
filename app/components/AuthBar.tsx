"use client";

import { useState } from "react";
import { login, register, setAuth, useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import Panel from "../ui/Panel";
import Button from "../ui/Button";

export default function AuthBar() {
  const t = useT();
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
      setError(e instanceof Error ? e.message : t("auth.failed"));
    } finally {
      setBusy(false);
    }
  };

  const logout = () => setAuth(null);

  if (auth) {
    return (
      <Panel className="mx-auto mt-6 flex w-full max-w-md items-center justify-between px-4 py-2 text-sm">
        <span data-testid="auth-user" className="text-muted-fg">{t("auth.signedInAs", { name: auth.username })}</span>
        <button data-testid="logout" onClick={logout} className="text-muted-fg underline hover:text-foreground">
          {t("auth.logout")}
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="mx-auto mt-6 w-full max-w-md p-4">
      <div className="mb-3 flex gap-3 text-sm">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            data-testid={`auth-tab-${m}`}
            onClick={() => setMode(m)}
            className={mode === m ? "font-semibold text-gold-soft" : "text-muted-fg"}
          >
            {m === "login" ? t("auth.login") : t("auth.register")}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-fg">{t("auth.optional")}</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          data-testid="auth-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("auth.username")}
          maxLength={40}
          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-gold-soft"
        />
        <input
          data-testid="auth-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder={t("auth.password")}
          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-gold-soft"
        />
        <Button data-testid="auth-submit" variant="gold" size="sm" onClick={submit} disabled={busy || !username || !password}>
          {mode === "login" ? t("auth.login") : t("auth.register")}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Panel>
  );
}
