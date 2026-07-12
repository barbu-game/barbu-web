"use client";

import { useEffect, useRef, useState } from "react";
import type { GameState } from "../lib/game";
import type { Variant } from "../lib/variants";
import { loadGuestName, saveGuestName } from "../lib/guest";
import VariantRules from "./VariantRules";

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
    <div className="mx-auto mt-16 w-full max-w-md rounded-2xl bg-slate-900/70 p-8 shadow-2xl ring-1 ring-white/10">
      <h1 className="mb-1 text-center text-4xl font-black tracking-tight text-white">Le Barbu</h1>
      <p className="mb-8 text-center text-sm text-slate-400">Trick-taking, online, 2–10 players</p>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
        Your name
      </label>
      {username ? (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-400/30 bg-slate-800 px-3 py-2">
          <span className="font-semibold text-emerald-300">{username}</span>
          <span className="text-xs text-slate-400">your account</span>
        </div>
      ) : (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player"
          maxLength={40}
          className="mb-6 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-400"
        />
      )}

      <div className="mb-6 rounded-xl border border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">New table</span>
          <select
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-slate-800 px-2 py-1 text-sm text-white"
          >
            {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                {n} players
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Variant</label>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-slate-800 px-2 py-1.5 text-sm text-white"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowRules((s) => !s)}
            className="mt-1 text-xs text-emerald-300 underline-offset-2 hover:underline"
          >
            {showRules ? "Hide rules" : "Show rules"}
          </button>
          {showRules && selectedVariant && (
            <div className="mt-2">
              <VariantRules variant={selectedVariant} />
            </div>
          )}
        </div>
        <button
          onClick={() => {
            remember(name);
            onCreate(displayName, playerCount, variantId);
          }}
          className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-400"
        >
          Create table
        </button>
        <button
          onClick={() => {
            remember(name);
            onQuickMatch(displayName, playerCount);
          }}
          className="mt-2 w-full rounded-lg border border-emerald-400/40 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
        >
          Quick match
        </button>
        {isLoggedIn ? (
          <button
            onClick={() => onRankedMatch(displayName)}
            className="mt-2 w-full rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
          >
            Ranked match
          </button>
        ) : (
          <p className="mt-2 text-center text-xs text-slate-500">Log in to play ranked</p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <span className="mb-3 block text-sm font-semibold text-white">Join with a code</span>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCDE"
            maxLength={5}
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 font-mono uppercase tracking-widest text-white outline-none focus:border-emerald-400"
          />
          <button
            onClick={() => {
              remember(name);
              onJoin(displayName, code);
            }}
            disabled={code.length < 4}
            className="rounded-lg bg-slate-700 px-5 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-40"
          >
            Join
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-center text-sm text-rose-400">{error}</p>}
      {status === "connecting" && <p className="mt-4 text-center text-sm text-slate-400">Connecting…</p>}
    </div>
  );
}

export function Searching({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="mx-auto mt-16 w-full max-w-md rounded-2xl bg-slate-900/70 p-8 text-center shadow-2xl ring-1 ring-white/10">
      <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
      <h2 className="mb-1 text-xl font-bold text-white">Finding a match…</h2>
      <p className="mb-6 text-sm text-slate-400">Looking for players. This can take a moment.</p>
      <button
        onClick={onCancel}
        className="w-full rounded-lg border border-white/10 bg-slate-800 py-2.5 font-semibold text-white transition hover:bg-slate-700"
      >
        Cancel
      </button>
    </div>
  );
}

function BotNameInput({ name, onCommit }: { name: string; onCommit: (n: string) => void }) {
  const [value, setValue] = useState(name);
  const focused = useRef(false);
  // Resynchronise sur le nom serveur seulement hors édition, pour ne pas écraser la frappe.
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
      className="w-40 rounded border border-white/10 bg-slate-900/60 px-2 py-1 text-sm text-white outline-none focus:border-emerald-400"
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
    const t = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = (text: string, what: "code" | "link") => {
    navigator.clipboard?.writeText(text).then(() => setCopied(what));
  };

  return (
    <div className="mx-auto mt-16 w-full max-w-lg rounded-2xl bg-slate-900/70 p-8 shadow-2xl ring-1 ring-white/10">
      <p className="text-center text-xs uppercase tracking-wide text-slate-400">Share this code</p>
      <button
        type="button"
        onClick={() => copy(state.roomId, "code")}
        title="Copy code"
        className="mx-auto mb-3 block font-mono text-5xl font-black tracking-[0.3em] text-emerald-400 transition hover:text-emerald-300"
      >
        {state.roomId}
      </button>
      <div className="mb-6 flex items-center gap-2">
        <input
          readOnly
          value={inviteLink}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-300 outline-none"
        />
        <button
          type="button"
          onClick={() => copy(inviteLink, "link")}
          className="shrink-0 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
        >
          {copied === "link" ? "Copied!" : copied === "code" ? "Code copied!" : "Copy link"}
        </button>
      </div>

      <ul className="mb-6 space-y-2">
        {state.players.map((p) => {
          const open = isOpen(p);
          const away = !p.bot && !p.connected && !open; // disconnected member holding their seat
          return (
            <li
              key={p.seat}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2"
            >
              <span className="flex items-center gap-2 text-white">
                {p.bot && isHost ? (
                  <BotNameInput name={p.name} onCommit={(n) => onRenameBot(p.seat, n)} />
                ) : open ? (
                  <span className="italic text-slate-500">Empty seat</span>
                ) : (
                  <span className={away ? "text-slate-400" : undefined}>
                    {p.name}
                    {away && <span className="ml-1 text-xs italic text-amber-300/80">(disconnected)</span>}
                  </span>
                )}
                {p.seat === state.yourSeat && <span className="text-xs text-emerald-400">(you)</span>}
                {p.seat === hostSeat && <span className="text-xs text-amber-300">(host)</span>}
              </span>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {p.bot ? "Bot" : open ? "—" : away ? "Away" : "Human"}
              </span>
            </li>
          );
        })}
      </ul>

      {isHost ? (
        <div className="flex gap-3">
          <button
            onClick={onAddBot}
            disabled={full}
            className="flex-1 rounded-lg bg-slate-700 py-2.5 font-semibold text-white transition hover:bg-slate-600 disabled:opacity-40"
          >
            Add bot
          </button>
          <button
            onClick={onStart}
            disabled={!full}
            className="flex-1 rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
          >
            Start game
          </button>
        </div>
      ) : (
        <p className="mb-3 text-center text-sm text-slate-400">Waiting for the host to start…</p>
      )}

      <button
        onClick={onLeave}
        className="mt-3 w-full rounded-lg border border-rose-400/40 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/10"
      >
        Leave table
      </button>
    </div>
  );
}
