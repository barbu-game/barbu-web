"use client";

import { useEffect, useRef, useState } from "react";
import type { GameState } from "../lib/game";
import type { Variant } from "../lib/variants";
import { loadGuestName, saveGuestName } from "../lib/guest";
import { useT } from "../lib/i18n";
import Panel from "../ui/Panel";
import Button from "../ui/Button";
import Crest from "../ui/Crest";
import VariantRules from "./VariantRules";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-gold-soft";

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
  onCreate: (name: string, playerCount: number, variant: string) => void;
  onJoin: (name: string, code: string) => void;
  onQuickMatch: (name: string, size: number) => void;
  onRankedMatch: (name: string) => void;
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
  const [showRules, setShowRules] = useState(false);

  // A signed-in player carries their account pseudo — no name to pick.
  const displayName = username ?? (name.trim() || "Player");
  const selectedVariant = variants.find((v) => v.id === variantId) ?? variants[0];

  // Remember a guest's typed pseudo so it pre-fills next time; accounts use their username.
  const remember = (n: string) => {
    if (!username) saveGuestName(n);
  };

  return (
    <Panel className="mx-auto mt-16 w-full max-w-md p-8 shadow-2xl">
      <div className="mb-6 flex flex-col items-center">
        <Crest size={60} />
        <h1 className="mt-4 bg-gradient-to-b from-[#fde9c8] to-gold bg-clip-text font-display text-4xl font-bold tracking-[0.08em] text-transparent">
          LE BARBU
        </h1>
        <p className="mt-2 max-w-xs text-center text-sm font-light text-muted-fg">{t("app.tagline")}</p>
      </div>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-fg">
        {t("home.yourName")}
      </label>
      {username ? (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-gold-soft/30 bg-surface px-3 py-2">
          <span className="font-semibold text-gold-soft">{username}</span>
          <span className="text-xs text-muted-fg">{t("home.yourAccount")}</span>
        </div>
      ) : (
        <input
          data-testid="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("home.namePlaceholder")}
          maxLength={40}
          className={`mb-6 ${FIELD}`}
        />
      )}

      <div className="mb-6 rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{t("home.newTable")}</span>
          <select
            data-testid="player-count"
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground"
          >
            {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n} className="bg-background">
                {t("home.players", { n })}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-fg">
            {t("home.variant")}
          </label>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} className="bg-background">
                {v.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowRules((s) => !s)}
            className="mt-1 text-xs text-gold-soft underline-offset-2 hover:underline"
          >
            {showRules ? t("home.hideRules") : t("home.showRules")}
          </button>
          {showRules && selectedVariant && (
            <div className="mt-2">
              <VariantRules variant={selectedVariant} />
            </div>
          )}
        </div>
        <Button
          data-testid="quick-match"
          variant="gold"
          className="w-full"
          onClick={() => {
            remember(name);
            onQuickMatch(displayName, playerCount);
          }}
        >
          {t("home.quickMatch")}
        </Button>
        <Button
          data-testid="create-table"
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            remember(name);
            onCreate(displayName, playerCount, variantId);
          }}
        >
          {t("home.createTable")}
        </Button>
        {isLoggedIn ? (
          <Button data-testid="ranked-match" variant="ghost" size="sm" className="mt-2 w-full" onClick={() => onRankedMatch(displayName)}>
            {t("home.ranked")}
          </Button>
        ) : (
          <p className="mt-2 text-center text-xs text-muted-fg">{t("home.loginForRanked")}</p>
        )}
      </div>

      <div className="rounded-xl border border-border p-4">
        <span className="mb-3 block text-sm font-semibold text-foreground">{t("home.joinTitle")}</span>
        <div className="flex gap-2">
          <input
            data-testid="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCDE"
            maxLength={5}
            className={`${FIELD} font-mono uppercase tracking-widest`}
          />
          <Button
            data-testid="join-button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => {
              remember(name);
              onJoin(displayName, code);
            }}
            disabled={code.length < 4}
          >
            {t("home.joinButton")}
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}
      {status === "connecting" && (
        <p className="mt-4 text-center text-sm text-muted-fg">{t("status.connecting")}</p>
      )}
    </Panel>
  );
}

export function Searching({ onCancel }: { onCancel: () => void }) {
  const t = useT();
  return (
    <Panel className="mx-auto mt-16 w-full max-w-md p-8 text-center shadow-2xl">
      <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-gold-soft/30 border-t-gold-soft" />
      <h2 className="mb-1 font-display text-xl font-semibold text-foreground">{t("searching.title")}</h2>
      <p className="mb-6 text-sm text-muted-fg">{t("searching.subtitle")}</p>
      <Button data-testid="cancel-search" variant="ghost" className="w-full" onClick={onCancel}>
        {t("searching.cancel")}
      </Button>
    </Panel>
  );
}

function BotNameInput({ name, onCommit }: { name: string; onCommit: (n: string) => void }) {
  const [value, setValue] = useState(name);
  const focused = useRef(false);
  // Resync to the server name only while not editing, so we don't overwrite typing.
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
      className="w-40 rounded border border-border bg-surface px-2 py-1 text-sm text-foreground outline-none focus:border-gold-soft"
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
    <Panel className="mx-auto mt-16 w-full max-w-lg p-8 shadow-2xl">
      <p className="text-center text-xs uppercase tracking-wide text-muted-fg">{t("lobby.shareCode")}</p>
      <button
        type="button"
        data-testid="room-code"
        onClick={() => copy(state.roomId, "code")}
        title={t("lobby.copyCode")}
        className="mx-auto mb-3 block font-display text-5xl font-bold tracking-[0.3em] text-gold-soft transition hover:brightness-110"
      >
        {state.roomId}
      </button>
      <div className="mb-6 flex items-center gap-2">
        <input
          readOnly
          value={inviteLink}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-fg outline-none"
        />
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => copy(inviteLink, "link")}
        >
          {copied === "link" ? t("lobby.copied") : copied === "code" ? t("lobby.codeCopied") : t("lobby.copyLink")}
        </Button>
      </div>

      <ul className="mb-6 space-y-2">
        {state.players.map((p) => {
          const open = isOpen(p);
          const away = !p.bot && !p.connected && !open; // disconnected member holding their seat
          return (
            <li
              key={p.seat}
              data-testid="lobby-seat"
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2"
            >
              <span className="flex items-center gap-2 text-foreground">
                {p.bot && isHost ? (
                  <BotNameInput name={p.name} onCommit={(n) => onRenameBot(p.seat, n)} />
                ) : open ? (
                  <span className="italic text-muted-fg">{t("lobby.emptySeat")}</span>
                ) : (
                  <span className={away ? "text-muted-fg" : undefined}>
                    {p.name}
                    {away && <span className="ml-1 text-xs italic text-gold-soft/80">({t("lobby.disconnected")})</span>}
                  </span>
                )}
                {p.seat === state.yourSeat && <span className="text-xs text-gold-soft">({t("table.you")})</span>}
                {p.seat === hostSeat && <span className="text-xs text-gold">({t("lobby.host")})</span>}
              </span>
              <span className="text-xs uppercase tracking-wide text-muted-fg">
                {p.bot ? t("table.bot") : open ? "—" : away ? t("lobby.away") : t("table.human")}
              </span>
            </li>
          );
        })}
      </ul>

      {isHost ? (
        <div className="flex gap-3">
          <Button data-testid="add-bot" variant="ghost" className="flex-1" onClick={onAddBot} disabled={full}>
            {t("lobby.addBot")}
          </Button>
          <Button data-testid="start-game" variant="gold" className="flex-1" onClick={onStart} disabled={!full}>
            {t("lobby.start")}
          </Button>
        </div>
      ) : (
        <p className="mb-3 text-center text-sm text-muted-fg">{t("lobby.waitingHost")}</p>
      )}

      <button
        data-testid="leave-table"
        onClick={onLeave}
        className="mt-3 w-full rounded-lg border border-danger/40 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10"
      >
        {t("lobby.leaveTable")}
      </button>
    </Panel>
  );
}
