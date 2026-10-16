"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Check, Copy, Crown, Link2, LogOut } from "lucide-react";
import type { GameState } from "../lib/game";
import type { Variant } from "../lib/variants";
import type { GameType } from "../lib/useGameSocket";
import { loadGuestName, saveGuestName } from "../lib/guest";
import { useT } from "../lib/i18n";
import { cn } from "../lib/cn";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import VariantRules from "./VariantRules";
import RamiRules from "./RamiRules";

const FIELD =
  "h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-fg/70 focus:border-gold-soft/60";

const LABEL = "mb-1.5 block text-xs font-medium text-muted-fg";

/** Centers a screen's card in the space under the header; scrolls only if the viewport is absurdly short. */
export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex h-full overflow-y-auto">
      <div className={cn("m-auto w-full max-w-md p-4", className)}>{children}</div>
    </div>
  );
}

export function Home({
  onCreate,
  onJoin,
  onQuickMatch,
  onRankedMatch,
  isLoggedIn,
  username,
  error,
  status,
  variants,
  initialCode,
}: {
  onCreate: (name: string, playerCount: number, variant: string, gameType: GameType) => void;
  onJoin: (name: string, code: string) => void;
  onQuickMatch: (name: string, size: number, gameType: GameType) => void;
  onRankedMatch: (name: string, gameType: GameType) => void;
  isLoggedIn: boolean;
  username: string | null;
  error: string | null;
  status: string;
  variants: Variant[];
  initialCode: string;
}) {
  const t = useT();
  const [name, setName] = useState(() => loadGuestName());
  const [playerCount, setPlayerCount] = useState(4);
  // An invite link lands here as /?join=CODE (passed in via searchParams) — seed the join box.
  const [code, setCode] = useState(initialCode);
  const [variantId, setVariantId] = useState("developer");
  const [gameType, setGameType] = useState<GameType>("BARBU");
  const rami = gameType === "RAMI";
  const [ramiCount, setRamiCount] = useState(5);
  const tableSize = rami ? ramiCount : playerCount;
  const [showRules, setShowRules] = useState(false);
  const [showRamiRules, setShowRamiRules] = useState(false);

  // A signed-in player carries their account pseudo — no name to pick.
  const displayName = username ?? (name.trim() || "Player");
  const selectedVariant = variants.find((v) => v.id === variantId) ?? variants[0];

  // Remember a guest's typed pseudo so it pre-fills next time; accounts use their username.
  const remember = (n: string) => {
    if (!username) saveGuestName(n);
  };

  return (
    <Screen>
      <p className="mb-4 text-center text-sm text-muted-fg">{t("app.tagline")}</p>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <label className={LABEL}>{t("home.yourName")}</label>
        {username ? (
          <div className="flex h-11 items-center justify-between rounded-lg border border-border bg-surface-2 px-3">
            <span className="font-medium">{username}</span>
            <span className="text-xs text-muted-fg">{t("home.yourAccount")}</span>
          </div>
        ) : (
          <input
            data-testid="name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("home.namePlaceholder")}
            maxLength={40}
            className={FIELD}
          />
        )}

        <div className="mb-1.5 mt-4 flex items-baseline justify-between">
          <label className="text-xs font-medium text-muted-fg">{t("home.game")}</label>
          {rami && (
            <button
              type="button"
              data-testid="rami-rules-link"
              onClick={() => setShowRamiRules(true)}
              className="text-xs text-gold-soft hover:underline"
            >
              {t("home.rules")}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-2 p-1" role="radiogroup">
          {(["BARBU", "RAMI"] as const).map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={gameType === g}
              data-testid={`game-${g.toLowerCase()}`}
              onClick={() => setGameType(g)}
              className={cn(
                "h-9 rounded-md text-sm font-medium transition-colors",
                gameType === g ? "bg-surface text-foreground shadow-sm" : "text-muted-fg hover:text-foreground",
              )}
            >
              {t(g === "BARBU" ? "game.barbu" : "game.rami")}
            </button>
          ))}
        </div>

        <div className={cn("mt-4 grid gap-3", rami ? "grid-cols-1" : "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
          <div>
            <label className={LABEL}>{t("home.newTable")}</label>
            <select
              data-testid="player-count"
              value={tableSize}
              onChange={(e) => (rami ? setRamiCount : setPlayerCount)(Number(e.target.value))}
              className={FIELD}
            >
              {(rami ? [4, 5] : Array.from({ length: 9 }, (_, i) => i + 2)).map((n) => (
                <option key={n} value={n} className="bg-surface">
                  {t("home.players", { n })}
                </option>
              ))}
            </select>
          </div>
          {!rami && (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="text-xs font-medium text-muted-fg">{t("home.variant")}</label>
              {selectedVariant && (
                <button
                  type="button"
                  onClick={() => setShowRules(true)}
                  className="text-xs text-gold-soft hover:underline"
                >
                  {t("home.rules")}
                </button>
              )}
            </div>
            <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className={FIELD}>
              {variants.map((v) => (
                <option key={v.id} value={v.id} className="bg-surface">
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          )}
        </div>

        {rami && <p className="mt-3 text-xs text-muted-fg">{t("home.ramiNote")}</p>}
        <Button
          data-testid="quick-match"
          className="mt-5 w-full"
          onClick={() => {
            remember(name);
            onQuickMatch(displayName, tableSize, gameType);
          }}
        >
          {t("home.quickMatch")}
        </Button>
        <div className={cn("mt-2 grid gap-2", isLoggedIn ? "grid-cols-2" : "grid-cols-1")}>
          <Button
            data-testid="create-table"
            variant="ghost"
            onClick={() => {
              remember(name);
              onCreate(displayName, tableSize, variantId, gameType);
            }}
          >
            {t("home.createTable")}
          </Button>
          {isLoggedIn && (
            <Button data-testid="ranked-match" variant="ghost" onClick={() => onRankedMatch(displayName, gameType)}>
              {t("home.ranked")}
            </Button>
          )}
        </div>
        {!isLoggedIn && <p className="mt-2 text-center text-xs text-muted-fg">{t("home.loginForRanked")}</p>}

        <div className="my-5 h-px bg-border" />

        <label className={LABEL}>{t("home.joinTitle")}</label>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length < 4) return;
            remember(name);
            onJoin(displayName, code);
          }}
        >
          <input
            data-testid="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCDE"
            maxLength={5}
            autoCapitalize="characters"
            autoComplete="off"
            className={cn(FIELD, "font-mono uppercase tracking-[0.3em]")}
          />
          <Button data-testid="join-button" type="submit" variant="ghost" className="shrink-0" disabled={code.length < 4}>
            {t("home.joinButton")}
          </Button>
        </form>

        {(error || status === "connecting") && (
          <p className={cn("mt-4 text-center text-sm", error ? "text-danger" : "text-muted-fg")}>
            {error ?? t("status.connecting")}
          </p>
        )}
      </div>

      <Dialog open={showRamiRules} onOpenChange={setShowRamiRules} title={t("game.rami")}>
        <RamiRules />
      </Dialog>
      {selectedVariant && (
        <Dialog open={showRules} onOpenChange={setShowRules} title={selectedVariant.name}>
          <VariantRules variant={selectedVariant} />
        </Dialog>
      )}
    </Screen>
  );
}

export function Searching({ onCancel }: { onCancel: () => void }) {
  const t = useT();
  return (
    <Screen className="text-center">
      <div className="mx-auto mb-6 h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-gold-soft" />
      <h2 className="text-lg font-semibold">{t("searching.title")}</h2>
      <p className="mt-1 text-sm text-muted-fg">{t("searching.subtitle")}</p>
      <Button data-testid="cancel-search" variant="ghost" className="mt-6 w-full" onClick={onCancel}>
        {t("searching.cancel")}
      </Button>
    </Screen>
  );
}

function BotNameInput({ name, onCommit }: { name: string; onCommit: (n: string) => void }) {
  const [value, setValue] = useState(name);
  const focused = useRef(false);
  // Resync with the server name only while not editing, so typing isn't overwritten.
  useEffect(() => {
    if (!focused.current) setValue(name);
  }, [name]);
  const commit = () => {
    const v = value.trim();
    if (v && v !== name) onCommit(v);
    else setValue(name);
  };
  return (
    <input
      value={value}
      maxLength={40}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="-ml-1.5 h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-sm text-foreground outline-none hover:border-border focus:border-gold-soft/60 focus:bg-surface"
    />
  );
}

export function RoomLobby({
  state,
  onAddBot,
  onStart,
  onLeave,
  onRenameBot,
}: {
  state: GameState;
  onAddBot: () => void;
  onStart: () => void;
  onLeave: () => void;
  onRenameBot: (seat: number, name: string) => void;
}) {
  const t = useT();
  const humanSeats = state.players.filter((p) => !p.bot && p.connected).map((p) => p.seat);
  const hostSeat = humanSeats.length ? Math.min(...humanSeats) : -1;
  const isHost = state.yourSeat === hostSeat;
  // An open seat has no occupant (the server omits the name); a disconnected member keeps their name.
  const isOpen = (p: GameState["players"][number]) => !p.bot && !p.connected && !p.name;
  // Reserved (away) seats count as filled, matching the server, so Start enables once every seat is taken.
  const filled = state.players.filter((p) => !isOpen(p)).length;
  const full = filled === state.playerCount;

  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const inviteLink = typeof window === "undefined" ? "" : `${window.location.origin}/?join=${state.roomId}`;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = (text: string, what: "code" | "link") => {
    navigator.clipboard?.writeText(text).then(() => setCopied(what));
  };

  return (
    <div className="flex h-full overflow-y-auto">
      <div className="m-auto flex w-full max-w-xl flex-col p-4">
        <div className="mb-4 text-center">
          <p className="text-xs font-medium text-muted-fg">{t("lobby.shareCode")}</p>
          <button
            type="button"
            data-testid="room-code"
            onClick={() => copy(state.roomId, "code")}
            title={t("lobby.copyCode")}
            className="mt-1 font-mono text-4xl font-semibold tracking-[0.3em] text-foreground transition-colors hover:text-gold-soft sm:text-5xl"
          >
            {state.roomId}
          </button>
          <div className="mt-3 flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => copy(state.roomId, "code")}>
              {copied === "code" ? <Check size={16} /> : <Copy size={16} />}
              {copied === "code" ? t("lobby.codeCopied") : t("lobby.copyCode")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => copy(inviteLink, "link")}>
              {copied === "link" ? <Check size={16} /> : <Link2 size={16} />}
              {copied === "link" ? t("lobby.copied") : t("lobby.copyLink")}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-2">
          <div className="flex items-center justify-between px-2 pb-2 pt-1 text-xs text-muted-fg">
            <span>{t("lobby.players")}</span>
            <span className="tabular-nums">
              {filled} / {state.playerCount}
            </span>
          </div>
          <ul className={cn("grid gap-1", state.playerCount > 4 && "grid-cols-2")}>
            {state.players.map((p) => {
              const open = isOpen(p);
              const away = !p.bot && !p.connected && !open; // disconnected member holding their seat
              const you = p.seat === state.yourSeat;
              return (
                <li
                  key={p.seat}
                  data-testid="lobby-seat"
                  className={cn(
                    "flex h-10 min-w-0 items-center gap-1.5 rounded-lg px-2 text-sm",
                    open ? "border border-dashed border-border" : "bg-surface-2",
                  )}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center text-muted-fg">
                    {p.seat === hostSeat ? (
                      <Crown size={15} className="text-gold-soft" aria-label={t("lobby.host")} />
                    ) : p.bot ? (
                      <Bot size={15} aria-label={t("table.bot")} />
                    ) : (
                      <span className={cn("h-2 w-2 rounded-full", open ? "bg-white/10" : away ? "bg-danger" : "bg-success")} />
                    )}
                  </span>
                  {p.bot && isHost ? (
                    <BotNameInput name={p.name} onCommit={(n) => onRenameBot(p.seat, n)} />
                  ) : (
                    <span className={cn("min-w-0 flex-1 truncate", (open || away) && "text-muted-fg", open && "italic")}>
                      {open ? t("lobby.emptySeat") : p.name}
                      {away && <span className="ml-1.5 text-xs">· {t("lobby.away")}</span>}
                    </span>
                  )}
                  {you && <span className="shrink-0 text-xs text-gold-soft">{t("table.you")}</span>}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {isHost ? (
            <div className="grid grid-cols-2 gap-2">
              <Button data-testid="add-bot" variant="ghost" onClick={onAddBot} disabled={full}>
                <Bot size={16} />
                {t("lobby.addBot")}
              </Button>
              <Button data-testid="start-game" onClick={onStart} disabled={!full}>
                {t("lobby.start")}
              </Button>
            </div>
          ) : (
            <p className="py-2 text-center text-sm text-muted-fg">{t("lobby.waitingHost")}</p>
          )}
          <button
            type="button"
            data-testid="leave-table"
            onClick={onLeave}
            className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm text-muted-fg transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={15} />
            {t("lobby.leaveTable")}
          </button>
        </div>
      </div>
    </div>
  );
}
