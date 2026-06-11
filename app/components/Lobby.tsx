"use client";

import { useState } from "react";
import type { GameState } from "../lib/game";
import type { Variant } from "../lib/variants";
import VariantRules from "./VariantRules";

export function Home({
  onCreate,
  onJoin,
  onQuickMatch,
  error,
  status,
  variants,
}: {
  onCreate: (name: string, playerCount: number, variant: string) => void;
  onJoin: (name: string, code: string) => void;
  onQuickMatch: (name: string, size: number) => void;
  error: string | null;
  status: string;
  variants: Variant[];
}) {
  const [name, setName] = useState("");
  const [playerCount, setPlayerCount] = useState(4);
  const [code, setCode] = useState("");
  const [variantId, setVariantId] = useState("developer");
  const [showRules, setShowRules] = useState(false);

  const displayName = name.trim() || "Player";
  const selectedVariant = variants.find((v) => v.id === variantId) ?? variants[0];

  return (
    <div className="mx-auto mt-16 w-full max-w-md rounded-2xl bg-slate-900/70 p-8 shadow-2xl ring-1 ring-white/10">
      <h1 className="mb-1 text-center text-4xl font-black tracking-tight text-white">Le Barbu</h1>
      <p className="mb-8 text-center text-sm text-slate-400">Trick-taking, online, 2–10 players</p>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
        Your name
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player"
        className="mb-6 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-400"
      />

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
          onClick={() => onCreate(displayName, playerCount, variantId)}
          className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-400"
        >
          Create table
        </button>
        <button
          onClick={() => onQuickMatch(displayName, playerCount)}
          className="mt-2 w-full rounded-lg border border-emerald-400/40 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
        >
          Quick match
        </button>
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
            onClick={() => onJoin(displayName, code)}
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

export function RoomLobby({
  state,
  onAddBot,
  onStart,
}: {
  state: GameState;
  onAddBot: () => void;
  onStart: () => void;
}) {
  const isHost = state.yourSeat === 0;
  const filled = state.players.filter((p) => p.bot || p.connected).length;
  const full = filled === state.playerCount;

  return (
    <div className="mx-auto mt-16 w-full max-w-lg rounded-2xl bg-slate-900/70 p-8 shadow-2xl ring-1 ring-white/10">
      <p className="text-center text-xs uppercase tracking-wide text-slate-400">Share this code</p>
      <p className="mb-6 text-center font-mono text-5xl font-black tracking-[0.3em] text-emerald-400">
        {state.roomId}
      </p>

      <ul className="mb-6 space-y-2">
        {state.players.map((p) => {
          const empty = !p.bot && !p.connected;
          return (
            <li
              key={p.seat}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2"
            >
              <span className="text-white">
                {empty ? <span className="italic text-slate-500">Empty seat</span> : p.name}
                {p.seat === state.yourSeat && <span className="ml-2 text-xs text-emerald-400">(you)</span>}
              </span>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {p.bot ? "Bot" : empty ? "—" : "Human"}
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
        <p className="text-center text-sm text-slate-400">Waiting for the host to start…</p>
      )}
    </div>
  );
}
