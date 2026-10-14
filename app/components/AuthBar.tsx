"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { login, register, setAuth, useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import { cn } from "../lib/cn";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";

const FIELD =
  "h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-fg/70 focus:border-gold-soft/60";

function AuthForm({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setAuth(await (mode === "login" ? login : register)({ username, password }));
      setPassword("");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-5">
      <div className="grid grid-cols-2 rounded-lg border border-border p-0.5 text-sm">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            data-testid={`auth-tab-${m}`}
            onClick={() => setMode(m)}
            className={cn(
              "h-9 rounded-md font-medium transition-colors",
              mode === m ? "bg-white/10 text-foreground" : "text-muted-fg hover:text-foreground",
            )}
          >
            {m === "login" ? t("auth.login") : t("auth.register")}
          </button>
        ))}
      </div>
      <input
        data-testid="auth-username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder={t("auth.username")}
        autoComplete="username"
        maxLength={40}
        className={FIELD}
      />
      <input
        data-testid="auth-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        placeholder={t("auth.password")}
        className={FIELD}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button data-testid="auth-submit" type="submit" disabled={busy || !username || !password}>
        {mode === "login" ? t("auth.login") : t("auth.register")}
      </Button>
      <p className="text-center text-xs text-muted-fg">{t("auth.optional")}</p>
    </form>
  );
}

/** Header entry point for accounts: shows the signed-in pseudo, and opens login/logout in a dialog. */
export default function AccountButton() {
  const t = useT();
  const auth = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-testid="account-button"
        onClick={() => setOpen(true)}
        className="flex h-9 max-w-40 items-center gap-2 rounded-lg px-2.5 text-sm text-muted-fg transition-colors hover:bg-white/[0.06] hover:text-foreground"
      >
        <UserRound size={18} className="shrink-0" />
        {auth ? (
          <span data-testid="auth-user" className="truncate font-medium text-foreground">
            {auth.username}
          </span>
        ) : (
          <span className="hidden sm:inline">{t("auth.login")}</span>
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen} title={auth ? t("auth.account") : t("auth.login")}>
        {auth ? (
          <div className="flex flex-col gap-4 p-5">
            <p className="text-sm text-muted-fg">{t("auth.signedInAs", { name: auth.username })}</p>
            <Button data-testid="logout" variant="ghost" onClick={() => setAuth(null)}>
              {t("auth.logout")}
            </Button>
          </div>
        ) : (
          <AuthForm onDone={() => setOpen(false)} />
        )}
      </Dialog>
    </>
  );
}
