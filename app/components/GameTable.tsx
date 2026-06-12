"use client";

import { useState } from "react";
import {
  CONTRACT_LABEL,
  SUIT_SYMBOL,
  canPass,
  isCardLegal,
  isRedSuit,
  isYourTurn,
  montanteRank,
  montanteRun,
  type CardT,
  type GameState,
  type MoveT,
} from "../lib/game";
import type { Variant } from "../lib/variants";
import PlayingCard from "./PlayingCard";
import VariantRules from "./VariantRules";

const SUIT_ORDER = ["SPADES", "HEARTS", "CLUBS", "DIAMONDS"];
const RANK_ORDER = [
  "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT",
  "NINE", "TEN", "JACK", "QUEEN", "KING", "ACE",
];

function sortHand(hand: CardT[]): CardT[] {
  return [...hand].sort((a, b) => {
    const s = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
    return s !== 0 ? s : RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
  });
}

export default function GameTable({
  state,
  variants,
  onPlay,
  onCastStopVote,
}: {
  state: GameState;
  variants: Variant[];
  onPlay: (move: MoveT) => void;
  onCastStopVote: (stop: boolean) => void;
}) {
  const yourTurn = isYourTurn(state);
  const [showRules, setShowRules] = useState(false);
  const currentVariant = variants.find((v) => v.id === state.variant?.id);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-4">
      <TopBar state={state} />
      {currentVariant && (
        <div className="rounded-xl bg-slate-900/70 px-4 py-2 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => setShowRules((s) => !s)}
            className="flex w-full items-center justify-between text-sm text-slate-300"
          >
            <span>
              Variant: <b className="text-emerald-300">{currentVariant.name}</b>
            </span>
            <span className="text-xs text-emerald-300 underline-offset-2 hover:underline">
              {showRules ? "Hide rules" : "Rules"}
            </span>
          </button>
          {showRules && (
            <div className="mt-2">
              <VariantRules variant={currentVariant} />
            </div>
          )}
        </div>
      )}
      <PlayersStrip state={state} />

      {state.stopVote?.open && <VotePanel state={state} onCastStopVote={onCastStopVote} />}

      <div className="flex flex-1 items-center justify-center rounded-2xl bg-emerald-950/40 p-6 ring-1 ring-white/5">
        {state.phase === "GAME_OVER" ? (
          <GameOver state={state} />
        ) : state.board ? (
          <MontanteBoard state={state} />
        ) : (
          <TrickArea state={state} />
        )}
      </div>

      {state.phase === "CONTRACT_SELECTION" && <RoundIntermission state={state} />}

      {state.phase === "PLAYING" && (
        <YourHand state={state} yourTurn={yourTurn} onPlay={onPlay} />
      )}
    </div>
  );
}

function VotePanel({
  state,
  onCastStopVote,
}: {
  state: GameState;
  onCastStopVote: (stop: boolean) => void;
}) {
  const vote = state.stopVote!;
  const voted = vote.youVoted !== null && vote.youVoted !== undefined;
  return (
    <div className="rounded-xl bg-amber-500/15 p-4 text-center ring-1 ring-amber-400/40">
      <p className="text-sm font-semibold text-amber-200">
        End of a dealer&apos;s turn — vote to stop the game here?
      </p>
      <p className="mt-1 text-xs text-amber-200/70">
        {vote.stopVotes} of {vote.humans} voted to stop
      </p>
      <div className="mt-3 flex justify-center gap-3">
        <button
          onClick={() => onCastStopVote(false)}
          disabled={voted}
          className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
        >
          Keep playing
        </button>
        <button
          onClick={() => onCastStopVote(true)}
          disabled={voted}
          className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-40"
        >
          Stop here
        </button>
      </div>
      {voted && <p className="mt-2 text-xs text-amber-200/60">Vote cast — waiting for others…</p>}
    </div>
  );
}

function TopBar({ state }: { state: GameState }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-900/70 px-4 py-2 text-sm text-slate-300 ring-1 ring-white/10">
      <span className="font-mono tracking-widest text-emerald-400">{state.roomId}</span>
      <span>
        Round <b className="text-white">{(state.roundNumber ?? 0) + 1}</b> / {state.plannedRounds}
      </span>
      <span>
        {state.contract ? (
          <b className="text-amber-300">{CONTRACT_LABEL[state.contract] ?? state.contract}</b>
        ) : state.nextContract ? (
          <span className="text-slate-400">
            next: <b className="text-amber-300/80">{CONTRACT_LABEL[state.nextContract] ?? state.nextContract}</b>
          </span>
        ) : (
          <span className="text-slate-500">dealing…</span>
        )}
      </span>
    </div>
  );
}

function PlayersStrip({ state }: { state: GameState }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {state.players.map((p) => {
        const active = state.currentActor === p.seat;
        const isDealer = state.dealer === p.seat;
        const isTaker = state.trick?.complete && state.trick.taker === p.seat;
        const roundScore = state.roundScores?.[p.seat];
        return (
          <div
            key={p.seat}
            className={[
              "rounded-xl px-3 py-2 ring-1 transition",
              isTaker
                ? "bg-sky-500/15 ring-sky-400"
                : active
                  ? "bg-emerald-500/20 ring-emerald-400"
                  : "bg-slate-900/60 ring-white/10",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-semibold text-white">
                {p.name}
                {p.seat === state.yourSeat && <span className="ml-1 text-xs text-emerald-400">(you)</span>}
              </span>
              {isTaker ? (
                <span className="text-[10px] font-semibold uppercase text-sky-300">takes</span>
              ) : (
                isDealer && <span className="text-[10px] uppercase text-amber-300">deal</span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>{state.handCounts ? `${state.handCounts[p.seat]} cards` : p.bot ? "bot" : "human"}</span>
              <span className="flex items-center gap-1.5">
                {roundScore !== undefined && roundScore !== 0 && (
                  <span className="font-mono text-amber-300" title="this round">
                    {roundScore}
                  </span>
                )}
                <span className="font-mono text-slate-200" title="total">
                  {state.totals?.[p.seat] ?? 0}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrickArea({ state }: { state: GameState }) {
  const trick = state.trick;
  const plays = trick?.plays ?? [];
  if (plays.length === 0) {
    return <p className="text-slate-500">Waiting for the first card…</p>;
  }
  const takerName =
    trick?.complete && trick.taker !== undefined ? state.players[trick.taker]?.name : null;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {plays.map((play) => {
          const isTaker = trick?.complete && play.seat === trick.taker;
          return (
            <div
              key={`${play.seat}-${play.card.suit}-${play.card.rank}`}
              className="animate-card-in flex flex-col items-center gap-1"
            >
              <PlayingCard card={play.card} size="lg" highlight={isTaker} />
              <span className={isTaker ? "text-xs font-semibold text-sky-300" : "text-xs text-slate-400"}>
                {state.players[play.seat]?.name}
              </span>
            </div>
          );
        })}
      </div>
      {takerName && (
        <p className="animate-card-in rounded-full bg-slate-700/80 px-4 py-1 text-sm font-semibold text-slate-100 ring-1 ring-white/15">
          ▸ {takerName} takes the trick — and leads next
        </p>
      )}
    </div>
  );
}

function MontanteBoard({ state }: { state: GameState }) {
  const board = state.board!;
  return (
    <div className="flex w-full flex-col gap-3">
      {Object.entries(board).map(([suit, col]) => (
        <div key={suit} className="flex items-center gap-3">
          <span
            className={["w-7 shrink-0 text-center text-2xl", isRedSuit(suit) ? "text-rose-500" : "text-slate-200"].join(
              " ",
            )}
          >
            {SUIT_SYMBOL[suit]}
          </span>
          {col.opened ? (
            <div className="flex flex-wrap">
              {montanteRun(col.low, col.high).map((value, i) => (
                <div key={value} className={i === 0 ? "" : "-ml-4"}>
                  <PlayingCard card={{ suit, rank: montanteRank(value) }} size="sm" highlight={value === 8} />
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm italic text-slate-600">not opened yet</span>
          )}
        </div>
      ))}
    </div>
  );
}

function RoundIntermission({ state }: { state: GameState }) {
  const next = state.nextContract;
  const recap = state.lastRound;
  const dealerName = state.players[state.dealer ?? 0]?.name;
  return (
    <div className="animate-card-in rounded-2xl bg-slate-900/80 p-5 ring-1 ring-white/10">
      {recap && (
        <div className="mb-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            {CONTRACT_LABEL[recap.contract] ?? recap.contract} — round results
          </p>
          <ol className="space-y-1.5">
            {recap.ranking.map((r) => (
              <li
                key={r.seat}
                className={[
                  "flex items-center justify-between rounded-lg px-3 py-1.5 ring-1",
                  r.rank === 1 ? "bg-amber-500/15 ring-amber-400/50" : "bg-slate-800/60 ring-white/10",
                ].join(" ")}
              >
                <span className="flex items-center gap-2 text-sm text-white">
                  <span className={r.rank === 1 ? "text-amber-300" : "text-slate-500"}>#{r.rank}</span>
                  <span className={r.seat === state.yourSeat ? "font-semibold text-emerald-300" : ""}>
                    {r.name}
                  </span>
                </span>
                <span
                  className={[
                    "font-mono text-sm",
                    r.points > 0 ? "text-emerald-400" : r.points < 0 ? "text-rose-400" : "text-slate-400",
                  ].join(" ")}
                >
                  {r.points > 0 ? `+${r.points}` : r.points}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/5 px-4 py-3 text-center ring-1 ring-amber-400/40">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/70">
          {recap ? "Next round" : "First round"}
        </p>
        <p className="mt-1 text-2xl font-black tracking-tight text-amber-200">
          {next ? CONTRACT_LABEL[next] ?? next : "…"}
        </p>
        {dealerName && <p className="mt-1 text-xs text-amber-200/60">{dealerName} deals</p>}
      </div>
    </div>
  );
}

function YourHand({
  state,
  yourTurn,
  onPlay,
}: {
  state: GameState;
  yourTurn: boolean;
  onPlay: (move: MoveT) => void;
}) {
  const hand = sortHand(state.yourHand ?? []);
  const passable = yourTurn && canPass(state);
  return (
    <div className="rounded-xl bg-slate-900/70 p-4 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {state.resolving ? "Collecting trick…" : yourTurn ? "Your turn" : "Waiting…"}
        </span>
        {passable && (
          <button
            onClick={() => onPlay({ kind: "pass" })}
            className="rounded-lg bg-slate-700 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-600"
          >
            Pass
          </button>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {hand.map((card) => {
          const legal = yourTurn && isCardLegal(state, card);
          return (
            <PlayingCard
              key={`${card.suit}-${card.rank}`}
              card={card}
              playable={legal}
              dimmed={yourTurn && !legal}
              onClick={legal ? () => onPlay({ kind: "card", suit: card.suit, rank: card.rank }) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

function GameOver({ state }: { state: GameState }) {
  const standings = state.standings ?? [];
  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-4 text-center text-2xl font-black text-white">Final standings</h2>
      <ol className="space-y-2">
        {standings.map((s) => (
          <li
            key={s.seat}
            className={[
              "flex items-center justify-between rounded-lg px-4 py-2 ring-1",
              s.rank === 1 ? "bg-amber-500/20 ring-amber-400" : "bg-slate-900/60 ring-white/10",
            ].join(" ")}
          >
            <span className="text-white">
              <b className="mr-2 text-slate-400">#{s.rank}</b>
              {s.name}
            </span>
            <span className="font-mono text-slate-200">{s.total}</span>
          </li>
        ))}
      </ol>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-400"
      >
        New game
      </button>
    </div>
  );
}
