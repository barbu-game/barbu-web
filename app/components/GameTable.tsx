"use client";

import {
  CONTRACT_LABEL,
  SUIT_SYMBOL,
  canPass,
  isCardLegal,
  isRedSuit,
  isYourTurn,
  montanteLabel,
  type CardT,
  type GameState,
  type MoveT,
} from "../lib/game";
import PlayingCard from "./PlayingCard";

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
  onChooseContract,
  onPlay,
}: {
  state: GameState;
  onChooseContract: (contract: string) => void;
  onPlay: (move: MoveT) => void;
}) {
  const yourTurn = isYourTurn(state);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-4">
      <TopBar state={state} />
      <PlayersStrip state={state} />

      <div className="flex flex-1 items-center justify-center rounded-2xl bg-emerald-950/40 p-6 ring-1 ring-white/5">
        {state.phase === "GAME_OVER" ? (
          <GameOver state={state} />
        ) : state.board ? (
          <MontanteBoard state={state} />
        ) : (
          <TrickArea state={state} />
        )}
      </div>

      {state.phase === "CONTRACT_SELECTION" && (
        <ContractPicker state={state} onChooseContract={onChooseContract} />
      )}

      {state.phase === "PLAYING" && (
        <YourHand state={state} yourTurn={yourTurn} onPlay={onPlay} />
      )}
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
        ) : (
          <span className="text-slate-500">choosing contract…</span>
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
        return (
          <div
            key={p.seat}
            className={[
              "rounded-xl px-3 py-2 ring-1 transition",
              active ? "bg-emerald-500/20 ring-emerald-400" : "bg-slate-900/60 ring-white/10",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-semibold text-white">
                {p.name}
                {p.seat === state.yourSeat && <span className="ml-1 text-xs text-emerald-400">(you)</span>}
              </span>
              {isDealer && <span className="text-[10px] uppercase text-amber-300">deal</span>}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>{state.handCounts ? `${state.handCounts[p.seat]} cards` : p.bot ? "bot" : "human"}</span>
              <span className="font-mono text-slate-200">{state.totals?.[p.seat] ?? 0}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrickArea({ state }: { state: GameState }) {
  const plays = state.trick?.plays ?? [];
  if (plays.length === 0) {
    return <p className="text-slate-500">Waiting for the first card…</p>;
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {plays.map((play) => (
        <div
          key={`${play.seat}-${play.card.suit}-${play.card.rank}`}
          className="animate-card-in flex flex-col items-center gap-1"
        >
          <PlayingCard card={play.card} size="lg" />
          <span className="text-xs text-slate-400">{state.players[play.seat]?.name}</span>
        </div>
      ))}
    </div>
  );
}

function MontanteBoard({ state }: { state: GameState }) {
  const board = state.board!;
  return (
    <div className="grid grid-cols-4 gap-4">
      {Object.entries(board).map(([suit, col]) => (
        <div key={suit} className="flex flex-col items-center gap-2">
          <span className={["text-3xl", isRedSuit(suit) ? "text-rose-500" : "text-slate-200"].join(" ")}>
            {SUIT_SYMBOL[suit]}
          </span>
          <div className="flex h-24 w-16 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-center text-sm text-slate-200">
            {col.opened ? (
              <span>
                {montanteLabel(col.low)} – {montanteLabel(col.high)}
              </span>
            ) : (
              <span className="text-slate-600">—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContractPicker({
  state,
  onChooseContract,
}: {
  state: GameState;
  onChooseContract: (contract: string) => void;
}) {
  if (state.currentActor !== state.yourSeat) {
    return (
      <p className="rounded-xl bg-slate-900/70 py-3 text-center text-sm text-slate-300 ring-1 ring-white/10">
        Waiting for {state.players[state.dealer ?? 0]?.name} to choose a contract…
      </p>
    );
  }
  return (
    <div className="rounded-xl bg-slate-900/70 p-4 ring-1 ring-white/10">
      <p className="mb-3 text-center text-sm font-semibold text-white">You deal — choose a contract</p>
      <div className="flex flex-wrap justify-center gap-2">
        {(state.availableContracts ?? []).map((c) => (
          <button
            key={c}
            onClick={() => onChooseContract(c)}
            className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
          >
            {CONTRACT_LABEL[c] ?? c}
          </button>
        ))}
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
        <span className="text-sm text-slate-400">{yourTurn ? "Your turn" : "Waiting…"}</span>
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
