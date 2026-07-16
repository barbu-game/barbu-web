"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
import type { RankedMessagesRankedResultEntry } from "@barbu-game/barbu-api";
import { useT, type TranslationKey } from "../lib/i18n";
import { cn } from "../lib/cn";
import { seatLayout } from "../lib/seatLayout";
import type { Variant } from "../lib/variants";
import Card from "../ui/Card";
import Panel from "../ui/Panel";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import CapturedArea from "./CapturedArea";
import VariantRules from "./VariantRules";

type T = ReturnType<typeof useT>;

const SUIT_ORDER = ["SPADES", "HEARTS", "CLUBS", "DIAMONDS"];
const RANK_ORDER = [
  "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT",
  "NINE", "TEN", "JACK", "QUEEN", "KING", "ACE",
];

const FELT =
  "rounded-[26px] border border-gold-soft/20 bg-[radial-gradient(ellipse_at_center,var(--color-felt),var(--color-felt-deep)_78%)] shadow-[inset_0_0_0_8px_rgba(9,45,24,0.55),inset_0_0_60px_rgba(0,0,0,0.45)]";

function sortHand(hand: CardT[]): CardT[] {
  return [...hand].sort((a, b) => {
    const s = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
    return s !== 0 ? s : RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
  });
}

// Translate the English contract names to the UI locale, falling back to the English label for
// any unknown key.
function contractName(t: T, key?: string | null): string {
  if (!key) return "";
  return key in CONTRACT_LABEL ? t(`contract.${key}` as TranslationKey) : (CONTRACT_LABEL[key] ?? key);
}

export default function GameTable({
  state,
  variants,
  rankedResults,
  onPlay,
  onCastStopVote,
  onCastPauseVote,
  onResume,
}: {
  state: GameState;
  variants: Variant[];
  rankedResults: RankedMessagesRankedResultEntry[] | null;
  onPlay: (move: MoveT) => void;
  onCastStopVote: (stop: boolean) => void;
  onCastPauseVote: (pause: boolean) => void;
  onResume: () => void;
}) {
  const t = useT();
  const yourTurn = isYourTurn(state);
  const [showRules, setShowRules] = useState(false);
  const currentVariant = variants.find((v) => v.id === state.variant?.id);

  const center =
    state.phase === "GAME_OVER" ? (
      <GameOver state={state} rankedResults={rankedResults} />
    ) : state.board ? (
      <MontanteBoard state={state} />
    ) : (
      <TrickArea state={state} />
    );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:min-h-screen">
      <TopBar state={state} />
      {currentVariant && (
        <Panel className="px-4 py-2">
          <button
            type="button"
            onClick={() => setShowRules((s) => !s)}
            className="flex w-full items-center justify-between text-sm text-muted-fg"
          >
            <span>
              {t("table.variant")}: <b className="text-gold-soft">{currentVariant.name}</b>
            </span>
            <span className="text-xs text-gold-soft underline-offset-2 hover:underline">
              {showRules ? t("home.hideRules") : t("home.rules")}
            </span>
          </button>
          {showRules && (
            <div className="mt-2">
              <VariantRules variant={currentVariant} />
            </div>
          )}
        </Panel>
      )}

      {state.stopVote?.open && <VotePanel state={state} onCastStopVote={onCastStopVote} />}
      {state.pauseVote?.open && <PauseVotePanel state={state} onCastPauseVote={onCastPauseVote} />}
      {state.paused?.active && <PauseOverlay endsAtMs={state.paused.endsAtMs} onResume={onResume} />}

      {/* Mobile: seats as a grid above a simple felt with the center content. */}
      <div className="flex flex-col gap-4 sm:hidden">
        <div className="grid grid-cols-2 gap-2">
          {state.players.map((p) => (
            <SeatTile key={p.seat} state={state} p={p} />
          ))}
        </div>
        <div className={cn(FELT, "grid min-h-[40vh] place-items-center p-6")}>{center}</div>
      </div>

      {/* Desktop: circular seats around the felt with the center content in the middle. */}
      <div className={cn(FELT, "relative hidden h-[clamp(420px,58vh,560px)] sm:block")}>
        <SeatsCircular state={state} />
        <div className="absolute left-1/2 top-1/2 flex w-[62%] -translate-x-1/2 -translate-y-1/2 justify-center">
          {center}
        </div>
      </div>

      {state.phase === "CONTRACT_SELECTION" && <RoundIntermission state={state} />}

      {state.phase === "PLAYING" && <YourHand state={state} yourTurn={yourTurn} onPlay={onPlay} />}
    </div>
  );
}

function SeatsCircular({ state }: { state: GameState }) {
  const positions = seatLayout(state.playerCount, state.yourSeat ?? 0);
  return (
    <>
      {state.players.map((p) => {
        const pos = positions.find((q) => q.seat === p.seat);
        if (!pos) return null;
        return (
          <SeatTile
            key={p.seat}
            state={state}
            p={p}
            className="absolute w-[150px]"
            style={{ top: `${pos.topPct}%`, left: `${pos.leftPct}%`, transform: "translate(-50%, -50%)" }}
          />
        );
      })}
    </>
  );
}

function SeatTile({
  state,
  p,
  className,
  style,
}: {
  state: GameState;
  p: GameState["players"][number];
  className?: string;
  style?: React.CSSProperties;
}) {
  const t = useT();
  const active = state.currentActor === p.seat;
  const isDealer = state.dealer === p.seat;
  const isTaker = state.trick?.complete && state.trick.taker === p.seat;
  const roundScore = state.roundScores?.[p.seat];
  const offline = !p.bot && !p.connected;
  const showTimer = active && !p.bot && typeof state.turnDeadlineEpochMs === "number";
  return (
    <div
      style={style}
      className={cn(
        "flex flex-col rounded-xl border bg-[rgba(6,26,15,0.55)] px-3 py-2 transition",
        isTaker
          ? "border-success shadow-[0_0_0_1px_rgba(34,197,94,0.4)]"
          : active
            ? "border-gold-soft shadow-[0_0_0_1px_rgba(240,180,95,0.4)]"
            : "border-border",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {p.name}
          {p.seat === state.yourSeat && <span className="ml-1 text-xs text-gold-soft">({t("table.you")})</span>}
        </span>
        {offline ? (
          <span className="shrink-0 text-[10px] font-semibold uppercase text-danger" title={t("lobby.disconnected")}>
            {t("table.offline")}
          </span>
        ) : isTaker ? (
          <span className="shrink-0 text-[10px] font-semibold uppercase text-success">{t("table.takes")}</span>
        ) : (
          isDealer && <span className="shrink-0 text-[10px] uppercase text-gold">{t("table.deal")}</span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-fg">
        <span>
          {state.handCounts
            ? t("table.cards", { n: state.handCounts[p.seat] })
            : p.bot
              ? t("table.bot")
              : t("table.human")}
        </span>
        <span className="flex items-center gap-1.5">
          {roundScore !== undefined && roundScore !== 0 && (
            <span
              className={cn("tabular-nums", roundScore > 0 ? "text-success" : "text-gold-soft")}
              title={t("table.thisRound")}
            >
              {roundScore > 0 ? `+${roundScore}` : roundScore}
            </span>
          )}
          <span className="tabular-nums text-foreground" title={t("table.total")}>
            {state.totals?.[p.seat] ?? 0}
          </span>
        </span>
      </div>
      {showTimer && <TurnTimerBar deadline={state.turnDeadlineEpochMs!} />}
      <div className="mt-auto">
        <CapturedArea
          cards={state.captured?.[p.seat] ?? []}
          contract={state.contract ?? undefined}
          playerCount={state.playerCount}
        />
      </div>
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
  const t = useT();
  const vote = state.stopVote!;
  const voted = vote.youVoted !== null && vote.youVoted !== undefined;
  return (
    <Panel className="border-gold-soft/40 bg-gold/10 p-4 text-center">
      <p className="text-sm font-semibold text-gold-soft">{t("vote.stopTitle")}</p>
      <p className="mt-1 text-xs text-gold-soft/70">{t("vote.stopCount", { n: vote.stopVotes, total: vote.humans })}</p>
      <div className="mt-3 flex justify-center gap-3">
        <Button data-testid="vote-stop-no" variant="success" size="sm" onClick={() => onCastStopVote(false)} disabled={voted}>
          {t("vote.keepPlaying")}
        </Button>
        <Button data-testid="vote-stop-yes" variant="danger" size="sm" onClick={() => onCastStopVote(true)} disabled={voted}>
          {t("vote.stopHere")}
        </Button>
      </div>
      {voted && <p className="mt-2 text-xs text-gold-soft/60">{t("vote.cast")}</p>}
    </Panel>
  );
}

function PauseVotePanel({
  state,
  onCastPauseVote,
}: {
  state: GameState;
  onCastPauseVote: (pause: boolean) => void;
}) {
  const t = useT();
  const vote = state.pauseVote!;
  const voted = vote.youVoted !== null && vote.youVoted !== undefined;
  return (
    <Panel className="border-gold-soft/30 bg-surface p-4 text-center">
      <p className="text-sm font-semibold text-gold-soft">{t("vote.pauseTitle")}</p>
      <p className="mt-1 text-xs text-gold-soft/70">{t("vote.pauseCount", { n: vote.pauseVotes, total: vote.humans })}</p>
      <div className="mt-3 flex justify-center gap-3">
        <Button data-testid="vote-pause-no" variant="success" size="sm" onClick={() => onCastPauseVote(false)} disabled={voted}>
          {t("vote.keepPlaying")}
        </Button>
        <Button data-testid="vote-pause-yes" variant="gold" size="sm" onClick={() => onCastPauseVote(true)} disabled={voted}>
          {t("vote.pause")}
        </Button>
      </div>
      {voted && <p className="mt-2 text-xs text-gold-soft/60">{t("vote.cast")}</p>}
    </Panel>
  );
}

function PauseOverlay({ endsAtMs, onResume }: { endsAtMs: number; onResume: () => void }) {
  const t = useT();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000)));
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAtMs]);
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <Dialog open className="flex flex-col items-center gap-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-gold-soft">{t("pause.title")}</p>
      <p className="font-display text-6xl font-bold tabular-nums text-foreground">
        {mm}:{ss}
      </p>
      <Button data-testid="resume-now" variant="success" onClick={onResume}>
        {t("pause.resumeNow")}
      </Button>
      <p className="text-xs text-muted-fg">{t("pause.orType")}</p>
    </Dialog>
  );
}

function TopBar({ state }: { state: GameState }) {
  const t = useT();
  return (
    <Panel className="flex items-center justify-between py-2 pl-4 pr-12 text-sm text-muted-fg sm:pr-4">
      <span data-testid="room-code" className="font-display tracking-[0.24em] text-gold-soft">{state.roomId}</span>
      <span>
        {t("table.round")}{" "}
        <b className="text-foreground">
          {Math.min((state.roundNumber ?? 0) + 1, state.plannedRounds ?? Infinity)}
        </b>{" "}
        / {state.plannedRounds}
      </span>
      <span>
        {state.contract ? (
          <b className="text-gold-soft">{contractName(t, state.contract)}</b>
        ) : state.nextContract ? (
          <span className="text-muted-fg">{t("table.next", { contract: contractName(t, state.nextContract) })}</span>
        ) : (
          <span className="text-muted-fg/70">{t("table.dealing")}</span>
        )}
      </span>
    </Panel>
  );
}

function TurnTimerBar({ deadline }: { deadline: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const remaining = Math.max(0, deadline - Date.now());
    // Restart the depletion from full each time the turn (deadline) changes.
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = `turn-timer ${remaining}ms linear forwards`;
  }, [deadline]);
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded bg-black/30">
      <div ref={ref} className="h-full rounded" style={{ width: "100%", backgroundColor: "var(--color-success)" }} />
    </div>
  );
}

function TrickArea({ state }: { state: GameState }) {
  const t = useT();
  const reduce = useReducedMotion();
  const trick = state.trick;
  const plays = trick?.plays ?? [];
  if (plays.length === 0) {
    return <p className="text-muted-fg">{t("table.firstCard")}</p>;
  }
  const takerName = trick?.complete && trick.taker != null ? state.players[trick.taker]?.name : null;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {plays.map((play, i) => {
          const isTaker = Boolean(trick?.complete && play.seat === trick.taker);
          return (
            <motion.div
              key={`${play.seat}-${play.card.suit}-${play.card.rank}`}
              initial={reduce ? false : { opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: reduce ? 0 : i * 0.04 }}
              className="flex w-20 flex-col items-center gap-1"
            >
              <Card card={play.card} size="lg" highlight={isTaker} />
              <span
                title={state.players[play.seat]?.name}
                className={cn(
                  "block w-full truncate text-center text-xs",
                  isTaker ? "font-semibold text-gold-soft" : "text-muted-fg",
                )}
              >
                {state.players[play.seat]?.name}
              </span>
            </motion.div>
          );
        })}
      </div>
      {takerName && (
        <p className="rounded-full border border-gold-soft/30 bg-[rgba(9,45,24,0.7)] px-4 py-1 text-sm font-semibold text-[#eafff1]">
          {t("table.takesTrick", { name: takerName })}
        </p>
      )}
    </div>
  );
}

function MontanteBoard({ state }: { state: GameState }) {
  const t = useT();
  const board = state.board!;
  return (
    <div className="flex w-full flex-col gap-3">
      {Object.entries(board).map(([suit, col]) => (
        <div key={suit} className="flex items-center gap-3">
          <span className={cn("w-7 shrink-0 text-center text-2xl", isRedSuit(suit) ? "text-danger" : "text-foreground")}>
            {SUIT_SYMBOL[suit]}
          </span>
          {col.opened ? (
            <div className="flex flex-wrap">
              {montanteRun(col.low, col.high).map((value, i) => (
                <div key={value} className={i === 0 ? "" : "-ml-4"}>
                  <Card card={{ suit, rank: montanteRank(value) }} size="sm" highlight={value === 8} />
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm italic text-[#0d3b1f]">{t("table.notOpened")}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function RoundIntermission({ state }: { state: GameState }) {
  const t = useT();
  const next = state.nextContract;
  const recap = state.lastRound;
  const dealerName = state.players[state.dealer ?? 0]?.name;
  return (
    <Panel className="animate-card-in p-5">
      {recap && (
        <div className="mb-4">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-fg">
            {t("intermission.roundResults", { contract: contractName(t, recap.contract) })}
          </p>
          <ol className="space-y-1.5">
            {recap.ranking.map((r) => (
              <li
                key={r.seat}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-1.5",
                  r.rank === 1 ? "border-gold-soft/50 bg-gold/15" : "border-border bg-surface",
                )}
              >
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <span className={r.rank === 1 ? "text-gold-soft" : "text-muted-fg"}>#{r.rank}</span>
                  <span className={r.seat === state.yourSeat ? "font-semibold text-gold-soft" : ""}>{r.name}</span>
                </span>
                <span
                  className={cn(
                    "tabular-nums text-sm",
                    r.points > 0 ? "text-success" : r.points < 0 ? "text-danger" : "text-muted-fg",
                  )}
                >
                  {r.points > 0 ? `+${r.points}` : r.points}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="rounded-xl border border-gold-soft/40 bg-gradient-to-r from-gold/20 to-gold/5 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-soft/70">
          {recap ? t("intermission.nextRound") : t("intermission.firstRound")}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight text-gold-soft">
          {next ? contractName(t, next) : "…"}
        </p>
        {dealerName && <p className="mt-1 text-xs text-gold-soft/60">{t("intermission.deals", { name: dealerName })}</p>}
      </div>
    </Panel>
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
  const t = useT();
  const hand = sortHand(state.yourHand ?? []);
  const passable = yourTurn && canPass(state);
  return (
    <Panel data-testid="your-hand" className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className={cn("text-sm", yourTurn ? "font-semibold text-gold-soft" : "text-muted-fg")}>
          {state.resolving ? t("table.collecting") : yourTurn ? t("table.yourTurn") : t("table.waiting")}
        </span>
        {passable && (
          <Button data-testid="pass-button" variant="ghost" size="sm" onClick={() => onPlay({ kind: "pass" })}>
            {t("table.pass")}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap justify-center pt-3.5">
        {hand.map((card, i) => {
          const legal = yourTurn && isCardLegal(state, card);
          return (
            <div key={`${card.suit}-${card.rank}`} className={cn("hover:z-10", i === 0 ? "" : "-ml-5")}>
              <Card
                card={card}
                playable={legal}
                dimmed={yourTurn && !legal}
                onClick={legal ? () => onPlay({ kind: "card", suit: card.suit, rank: card.rank }) : undefined}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function GameOver({
  state,
  rankedResults,
}: {
  state: GameState;
  rankedResults: RankedMessagesRankedResultEntry[] | null;
}) {
  const t = useT();
  const standings = state.standings ?? [];
  const eloBySeat = new Map((rankedResults ?? []).map((e) => [e.seat, e]));
  return (
    <div data-testid="final-standings" className="w-full max-w-sm">
      <h2 className="mb-4 text-center font-display text-2xl font-bold text-foreground">{t("over.finalStandings")}</h2>
      <ol className="space-y-2">
        {standings.map((s) => {
          const elo = eloBySeat.get(s.seat);
          return (
            <li
              key={s.seat}
              data-testid="standing-row"
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-2",
                s.rank === 1 ? "border-gold-soft bg-gold/20" : "border-border bg-[rgba(6,26,15,0.55)]",
              )}
            >
              <span className="text-foreground">
                <b className="mr-2 text-muted-fg">#{s.rank}</b>
                {s.name}
              </span>
              <span className="flex items-center gap-2">
                {elo && (
                  <span className="tabular-nums text-xs text-muted-fg" title="ELO">
                    {elo.ratingAfter}{" "}
                    <span className={elo.delta >= 0 ? "text-success" : "text-danger"}>
                      ({elo.delta >= 0 ? "+" : ""}
                      {elo.delta})
                    </span>
                  </span>
                )}
                <span className="tabular-nums text-foreground">{s.total}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <Button variant="gold" className="mt-6 w-full" onClick={() => window.location.reload()}>
        {t("over.newGame")}
      </Button>
    </div>
  );
}
