"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Layers } from "lucide-react";
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
import { fanLayout } from "../lib/fan";
import { seatAngle } from "../lib/seatLayout";
import { useElementSize } from "../lib/useElementSize";
import type { Variant } from "../lib/variants";
import Card, { CARD_RATIO } from "../ui/Card";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import IconButton from "../ui/IconButton";
import CapturedArea from "./CapturedArea";
import VariantRules from "./VariantRules";

type T = ReturnType<typeof useT>;
type Player = GameState["players"][number];

const SUIT_ORDER = ["SPADES", "HEARTS", "CLUBS", "DIAMONDS"];
const RANK_ORDER = [
  "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT",
  "NINE", "TEN", "JACK", "QUEEN", "KING", "ACE",
];

// Below this felt width, opponents move to a strip above the felt instead of sitting around it.
const NARROW_FELT = 640;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

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

// Typographic minus: the ASCII hyphen sits too short and loose next to tabular figures.
const num = (n: number) => (n < 0 ? `\u2212${-n}` : String(n));
const signed = (n: number) => (n > 0 ? `+${n}` : num(n));

/** Opponents in clockwise order starting from the player on your left. */
function opponents(state: GameState): Player[] {
  const you = state.yourSeat ?? 0;
  return state.players
    .filter((p) => p.seat !== you)
    .sort((a, b) => ((a.seat - you + state.playerCount) % state.playerCount) - ((b.seat - you + state.playerCount) % state.playerCount));
}

export function GameHeaderInfo({ state }: { state: GameState }) {
  const t = useT();
  const round = Math.min((state.roundNumber ?? 0) + 1, state.plannedRounds ?? Infinity);
  return (
    <div className="min-w-0 leading-tight">
      <p className="truncate text-[15px] font-semibold">
        {state.phase === "GAME_OVER" ? (
          t("over.title")
        ) : state.contract ? (
          contractName(t, state.contract)
        ) : state.nextContract ? (
          <span className="text-muted-fg">{t("table.next", { contract: contractName(t, state.nextContract) })}</span>
        ) : (
          <span className="text-muted-fg">{t("table.dealing")}</span>
        )}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-fg">
        {t("table.round")} <span className="tabular-nums text-foreground/80">{round}</span>/{state.plannedRounds}
        <span className="mx-1.5">·</span>
        <span data-testid="room-code" className="font-mono tracking-wider">
          {state.roomId}
        </span>
      </p>
    </div>
  );
}

export function RulesButton({ state, variants }: { state: GameState; variants: Variant[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const variant = variants.find((v) => v.id === state.variant?.id);
  if (!variant) return null;
  return (
    <>
      <IconButton label={t("home.rules")} onClick={() => setOpen(true)}>
        <BookOpen size={18} />
      </IconButton>
      <Dialog open={open} onOpenChange={setOpen} title={variant.name}>
        <VariantRules variant={variant} />
      </Dialog>
    </>
  );
}

export default function GameTable({
  state,
  rankedResults,
  onPlay,
  onCastStopVote,
  onCastPauseVote,
  onResume,
}: {
  state: GameState;
  rankedResults: RankedMessagesRankedResultEntry[] | null;
  onPlay: (move: MoveT) => void;
  onCastStopVote: (stop: boolean) => void;
  onCastPauseVote: (pause: boolean) => void;
  onResume: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <Table state={state} />

        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-col items-center gap-2 px-3">
          {state.stopVote?.open && <StopVote state={state} onCastStopVote={onCastStopVote} />}
          {state.pauseVote?.open && <PauseVote state={state} onCastPauseVote={onCastPauseVote} />}
        </div>

        {state.phase === "CONTRACT_SELECTION" && (
          <Overlay>
            <RoundIntermission state={state} />
          </Overlay>
        )}
        {state.phase === "GAME_OVER" && (
          <Overlay>
            <GameOver state={state} rankedResults={rankedResults} />
          </Overlay>
        )}
      </div>

      <YourHand state={state} onPlay={onPlay} />

      {state.paused?.active && <PauseOverlay endsAtMs={state.paused.endsAtMs} onResume={onResume} />}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex overflow-y-auto bg-background/40 p-3 backdrop-blur-[2px]">
      <div className="animate-fade-in m-auto w-full max-w-sm rounded-2xl border border-border bg-surface/95 p-5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function Table({ state }: { state: GameState }) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const others = opponents(state);
  const ready = size.width > 0;
  const narrow = ready && size.width < NARROW_FELT;

  return (
    <div className="flex h-full flex-col gap-2 p-2 sm:p-4">
      {narrow && <OpponentStrip state={state} players={others} />}
      <div
        ref={ref}
        className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/[0.06] bg-[radial-gradient(ellipse_at_50%_40%,var(--color-felt),var(--color-felt-deep)_75%)] shadow-[inset_0_0_0_6px_rgba(0,0,0,0.12),inset_0_0_80px_rgba(0,0,0,0.35)]"
      >
        {ready && !narrow && <SeatsAround state={state} players={others} size={size} />}
        {ready &&
          (state.board ? (
            <MontanteBoard state={state} size={size} narrow={narrow} />
          ) : (
            <TrickArea state={state} size={size} narrow={narrow} />
          ))}
      </div>
    </div>
  );
}

const SEAT_W = (feltWidth: number) => clamp(feltWidth * 0.17, 132, 176);
// Estimated tile height: enough to keep the tile (plus a row of captured cards) off the edges.
const SEAT_H = 84;

/** Centres of the opponents' tiles around a wide felt, kept fully inside it. */
function seatCenters(size: { width: number; height: number }, state: GameState) {
  const pw = SEAT_W(size.width);
  const you = state.yourSeat ?? 0;
  return state.players
    .filter((p) => p.seat !== you)
    .map((p) => {
      const a = seatAngle(p.seat, state.playerCount, you);
      return {
        seat: p.seat,
        x: clamp(size.width / 2 + Math.cos(a) * size.width * 0.44, pw / 2 + 10, size.width - pw / 2 - 10),
        y: clamp(size.height / 2 + Math.sin(a) * size.height * 0.4, SEAT_H / 2 + 4, size.height - SEAT_H / 2 - 4),
      };
    });
}

/** Largest centred area free of seat tiles, shrinking from whichever side each tile mostly sits on. */
function freeArea(size: { width: number; height: number }, state: GameState) {
  const pw = SEAT_W(size.width);
  const cx = size.width / 2;
  const cy = size.height / 2;
  let hw = cx - 8;
  let hh = cy - 8;
  for (const c of seatCenters(size, state)) {
    const dx = Math.abs(c.x - cx);
    const dy = Math.abs(c.y - cy);
    const overlaps = dx - pw / 2 < hw && dy - SEAT_H / 2 < hh;
    if (!overlaps) continue;
    if (dx / hw > dy / hh) hw = Math.max(0, dx - pw / 2 - 8);
    else hh = Math.max(0, dy - SEAT_H / 2 - 8);
  }
  return { x: cx - hw, y: cy - hh, w: 2 * hw, h: 2 * hh };
}

function SeatsAround({ state, players, size }: { state: GameState; players: Player[]; size: { width: number; height: number } }) {
  const pw = SEAT_W(size.width);
  const centers = new Map(seatCenters(size, state).map((c) => [c.seat, c]));
  return (
    <>
      {players.map((p) => {
        const { x, y } = centers.get(p.seat)!;
        return (
          <div
            key={p.seat}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y, width: pw }}
          >
            <SeatBadge state={state} p={p} />
          </div>
        );
      })}
    </>
  );
}

function OpponentStrip({ state, players }: { state: GameState; players: Player[] }) {
  const cols = players.length <= 3 ? players.length : players.length === 4 ? 2 : 3;
  return (
    <div className="grid shrink-0 gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {players.map((p) => (
        <SeatBadge key={p.seat} state={state} p={p} compact />
      ))}
    </div>
  );
}

function SeatBadge({ state, p, compact }: { state: GameState; p: Player; compact?: boolean }) {
  const t = useT();
  const active = state.currentActor === p.seat && state.phase === "PLAYING";
  const isDealer = state.dealer === p.seat;
  const isTaker = Boolean(state.trick?.complete && state.trick.taker === p.seat);
  const roundScore = state.roundScores?.[p.seat];
  const offline = !p.bot && !p.connected;
  const showTimer = active && !p.bot && typeof state.turnDeadlineEpochMs === "number";
  const cards = state.handCounts?.[p.seat];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-2.5 transition-colors duration-200",
        compact ? "bg-surface py-1.5" : "bg-black/35 py-2 backdrop-blur-sm",
        isTaker ? "border-success/70" : active ? "border-gold-soft/80" : "border-white/[0.07]",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("min-w-0 flex-1 truncate font-medium", compact ? "text-[13px]" : "text-sm", offline && "text-muted-fg")}>
          {p.name}
        </span>
        {isDealer && (
          <span title={t("table.deal")} className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gold-soft/90 text-[9px] font-bold text-[#231a08]">
            D
          </span>
        )}
        {offline && <span title={t("lobby.disconnected")} className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />}
      </div>
      <div className={cn("flex items-center gap-2 tabular-nums text-muted-fg", compact ? "text-[11px]" : "text-xs")}>
        {typeof cards === "number" && <span className="flex items-center gap-1" title={t("table.cards", { n: cards })}>
            <Layers size={11} />
            {cards}
          </span>}
        {roundScore !== undefined && roundScore !== 0 && (
          <span className={roundScore > 0 ? "text-success" : "text-danger"} title={t("table.thisRound")}>
            {signed(roundScore)}
          </span>
        )}
        <span className="ml-auto font-semibold text-foreground" title={t("table.total")}>
          {num(state.totals?.[p.seat] ?? 0)}
        </span>
      </div>
      {/* Fixed-height row: a growing tile would resize the felt mid-trick. */}
      {!state.board && (
        <div className={cn("mt-1.5", compact && "h-6 overflow-hidden")}>
          <CapturedArea
            cards={state.captured?.[p.seat] ?? []}
            contract={state.contract ?? undefined}
            playerCount={state.playerCount}
            size="xs"
            tight={compact}
          />
        </div>
      )}
      {showTimer && <TurnTimerBar deadline={state.turnDeadlineEpochMs!} />}
    </div>
  );
}

function TurnTimerBar({ deadline, className }: { deadline: number; className?: string }) {
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
    <div className={cn("absolute inset-x-0 bottom-0 h-[3px] bg-black/30", className)}>
      <div ref={ref} className="h-full origin-left bg-gold-soft" />
    </div>
  );
}

const TRICK_LABEL = 16;

type TrickSlots = { cw: number; at: (seat: number) => { x: number; y: number; dx: number; dy: number } };

/**
 * Where each player's card lands in the trick. Cards sit on a ring matching the seats (the
 * largest card for which neighbours and their name labels don't overlap). Wide tables tuck the
 * ring inside the seats; narrow ones use the whole felt, and when even that is too crowded the
 * trick falls back to a two-row grid with a fixed slot per seat.
 */
function trickSlots(size: { width: number; height: number }, state: GameState, narrow: boolean): TrickSlots {
  const n = state.playerCount;
  const you = state.yourSeat ?? 0;
  const cx = size.width / 2;
  const cy = size.height / 2;
  const ring = (cw: number, rx: number, ry: number): TrickSlots => ({
    cw,
    at: (seat) => {
      const a = seatAngle(seat, n, you);
      return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, dx: Math.cos(a), dy: Math.sin(a) };
    },
  });

  const max = narrow ? 72 : 88;
  const min = narrow ? 44 : 48;
  for (let cw = Math.round(narrow ? Math.min(max, size.width / 5.2, size.height / 4.4) : Math.min(max, Math.min(size.width, size.height) * 0.15)); cw >= min; cw -= 2) {
    const ch = cw * CARD_RATIO;
    // Few players huddle near the centre; when that crowds the ring, spread to the felt's edges.
    const fullRx = narrow ? size.width / 2 - cw / 2 - 10 : size.width * 0.22;
    const fullRy = narrow ? size.height / 2 - ch / 2 - TRICK_LABEL - 6 : size.height * 0.2;
    const candidates = narrow
      ? [
          [Math.min(fullRx, cw * (0.9 + 0.22 * n)), Math.min(fullRy, ch * (0.55 + 0.12 * n))],
          [fullRx, fullRy],
        ]
      : [[fullRx, fullRy]];
    for (const [rx, ry] of candidates) {
      if (ringClear(n, rx, ry, cw + 4, ch + TRICK_LABEL + 2)) return ring(cw, rx, ry);
    }
  }
  // Grid fallback, inside the free area between the seats on wide tables.
  const box = narrow ? { x: 8, y: 8, w: size.width - 16, h: size.height - 16 } : freeArea(size, state);
  const cols = Math.ceil(n / 2);
  const cellW = box.w / cols;
  const cellH = box.h / 2;
  const cw = Math.floor(Math.min(cellW - 8, (cellH - TRICK_LABEL - 8) / CARD_RATIO, max));
  return {
    cw,
    at: (seat) => {
      // Opponents clockwise from your left, then you, so each seat keeps the same slot all game.
      const slot = (((seat - you + n) % n) + n - 1) % n;
      const row = Math.floor(slot / cols);
      const col = slot % cols;
      const inRow = row === 0 ? cols : n - cols;
      const offset = box.x + (box.w - inRow * cellW) / 2;
      return { x: offset + (col + 0.5) * cellW, y: box.y + (row + 0.5) * cellH - TRICK_LABEL / 2, dx: 0, dy: row ? 1 : -1 };
    },
  };
}

function ringClear(n: number, rx: number, ry: number, w: number, h: number): boolean {
  const at = (k: number) => {
    const a = Math.PI / 2 + (k / n) * 2 * Math.PI;
    return [Math.cos(a) * rx, Math.sin(a) * ry];
  };
  for (let k = 0; k < n; k++) {
    const [x1, y1] = at(k);
    const [x2, y2] = at(k + 1);
    if (Math.abs(x1 - x2) < w && Math.abs(y1 - y2) < h) return false;
  }
  return true;
}

function TrickArea({ state, size, narrow }: { state: GameState; size: { width: number; height: number }; narrow: boolean }) {
  const t = useT();
  const reduce = useReducedMotion();
  const trick = state.trick;
  const plays = trick?.plays ?? [];
  const slots = trickSlots(size, state, narrow);
  const cw = slots.cw;
  const ch = cw * CARD_RATIO;

  const takerName = trick?.complete && trick.taker != null ? state.players[trick.taker]?.name : null;

  return (
    <>
      {plays.length === 0 && state.phase === "PLAYING" && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-white/40">{t("table.firstCard")}</p>
      )}
      {plays.map((play, i) => {
        const { x, y, dx, dy } = slots.at(play.seat);
        const isTaker = Boolean(trick?.complete && play.seat === trick.taker);
        return (
          <motion.div
            key={`${play.seat}-${play.card.suit}-${play.card.rank}`}
            initial={reduce ? false : { opacity: 0, x: dx * 40, y: dy * 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: x - cw / 2, top: y - ch / 2, width: cw, zIndex: i + 1 }}
          >
            <Card card={play.card} width={cw} highlight={isTaker} />
            <span
              className={cn(
                "h-3 w-full truncate text-center text-[11px] leading-none",
                isTaker ? "font-semibold text-gold-soft" : "text-white/55",
              )}
            >
              {state.players[play.seat]?.name}
            </span>
          </motion.div>
        );
      })}
      {takerName && (
        <p
          className="animate-fade-in absolute left-1/2 top-1/2 z-[30] max-w-[80%] -translate-x-1/2 -translate-y-1/2 truncate rounded-full bg-black/60 px-3.5 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          {t("table.takesTrick", { name: takerName })}
        </p>
      )}
    </>
  );
}

function MontanteBoard({ state, size, narrow }: { state: GameState; size: { width: number; height: number }; narrow: boolean }) {
  const t = useT();
  const board = state.board!;
  const suits = SUIT_ORDER.filter((s) => s in board);
  const boxW = narrow ? size.width - 24 : Math.min(size.width * 0.58, 640);
  const boxH = narrow ? size.height - 24 : size.height * 0.56;
  const gap = 8;
  const suitW = 22;
  const rowH = (boxH - gap * (suits.length - 1)) / Math.max(1, suits.length);
  const cw = Math.round(clamp(rowH / CARD_RATIO, 28, narrow ? 54 : 64));
  return (
    <div
      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col justify-center"
      style={{ width: boxW, height: boxH, gap }}
    >
      {suits.map((suit) => {
        const col = board[suit];
        const run = col.opened ? montanteRun(col.low, col.high) : [];
        const fan = fanLayout(run.length, cw, boxW - suitW - 8, cw * 0.62, 0);
        return (
          <div key={suit} className="flex items-center gap-2" style={{ height: Math.min(rowH, cw * CARD_RATIO) }}>
            <span className={cn("w-[22px] shrink-0 text-center text-xl", isRedSuit(suit) ? "text-[#f08a80]" : "text-foreground")}>
              {SUIT_SYMBOL[suit]}
            </span>
            {run.length ? (
              <div className="flex">
                {run.map((value, i) => (
                  <div key={value} style={{ marginLeft: i === 0 ? 0 : fan.step - cw }}>
                    <Card card={{ suit, rank: montanteRank(value) }} width={cw} highlight={value === 8} />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-white/40">{t("table.notOpened")}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function YourHand({ state, onPlay }: { state: GameState; onPlay: (move: MoveT) => void }) {
  const t = useT();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const yourTurn = isYourTurn(state) && state.phase === "PLAYING";
  const hand = sortHand(state.yourHand ?? []);
  const passable = yourTurn && canPass(state);
  const narrow = size.width > 0 && size.width < 640;
  const you = state.yourSeat ?? 0;

  const cw = Math.round(narrow ? clamp(size.width / 6.4, 50, 64) : clamp(size.width / 11, 72, 92));
  const ch = cw * CARD_RATIO;
  const minStep = narrow ? 22 : 26;
  const fan = fanLayout(hand.length, cw, size.width, cw * 0.62, minStep);
  // Reserve the height of a full deal so the felt doesn't jump when a two-row hand drops to one row.
  const fullHand = Math.floor(52 / state.playerCount);
  const reservedRows = fanLayout(fullHand, cw, size.width, cw * 0.62, minStep).rows;
  const rowOffset = ch * 0.5;
  const lift = 12;
  const height = ch + (reservedRows - 1) * rowOffset + lift;

  const roundScore = state.roundScores?.[you];
  const showTimer = yourTurn && typeof state.turnDeadlineEpochMs === "number";

  return (
    <div
      data-testid="your-hand"
      className="relative shrink-0 border-t border-border bg-surface/80 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:px-4"
    >
      {showTimer && <TurnTimerBar deadline={state.turnDeadlineEpochMs!} className="bottom-auto top-0" />}
      <div className="flex h-11 items-center gap-3">
        <span className={cn("min-w-0 truncate text-sm", yourTurn ? "font-semibold text-gold-soft" : "text-muted-fg")}>
          {state.phase !== "PLAYING"
            ? (state.players[you]?.name ?? "")
            : state.resolving
              ? t("table.collecting")
              : yourTurn
                ? t("table.yourTurn")
                : t("table.waiting")}
        </span>
        {state.dealer === you && (
          <span title={t("table.deal")} className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gold-soft/90 text-[9px] font-bold text-[#231a08]">
            D
          </span>
        )}
        <CapturedArea
          cards={state.captured?.[you] ?? []}
          contract={state.contract ?? undefined}
          playerCount={state.playerCount}
          size="xs"
          tight
          className="min-w-0 overflow-hidden"
        />
        <span className="ml-auto flex shrink-0 items-center gap-2 text-sm tabular-nums">
          {roundScore !== undefined && roundScore !== 0 && (
            <span className={roundScore > 0 ? "text-success" : "text-danger"} title={t("table.thisRound")}>
              {signed(roundScore)}
            </span>
          )}
          <span className="font-semibold" title={t("table.total")}>
            {num(state.totals?.[you] ?? 0)}
          </span>
        </span>
        {passable && (
          <Button data-testid="pass-button" variant="ghost" size="sm" className="shrink-0" onClick={() => onPlay({ kind: "pass" })}>
            {t("table.pass")}
          </Button>
        )}
      </div>
      <div ref={ref} className="relative" style={{ height: size.width ? height : ch + lift }}>
        {size.width > 0 &&
          hand.map((card, i) => {
            const row = fan.rows === 2 && i >= fan.perRow ? 1 : 0;
            const inRow = row ? i - fan.perRow : i;
            const rowCount = row ? hand.length - fan.perRow : Math.min(fan.perRow, hand.length);
            const rowWidth = cw + (rowCount - 1) * fan.step;
            const legal = yourTurn && isCardLegal(state, card);
            return (
              <div
                key={`${card.suit}-${card.rank}`}
                className="absolute transition-[left,top] duration-200 ease-out hover:z-50 motion-reduce:transition-none"
                style={{
                  left: (size.width - rowWidth) / 2 + inRow * fan.step,
                  top: lift + (fan.rows === 2 ? row * rowOffset : ((reservedRows - 1) * rowOffset) / 2),
                  zIndex: i + 1,
                }}
              >
                <Card
                  card={card}
                  width={cw}
                  playable={legal}
                  raised={legal}
                  dimmed={yourTurn && !legal}
                  onClick={legal ? () => onPlay({ kind: "card", suit: card.suit, rank: card.rank }) : undefined}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

function VoteCard({ title, count, children, voted }: { title: string; count: string; children: React.ReactNode; voted: boolean }) {
  const t = useT();
  return (
    <div className="animate-fade-in pointer-events-auto w-full max-w-sm rounded-xl border border-border bg-surface-2/95 p-3.5 shadow-2xl backdrop-blur">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-fg">{voted ? t("vote.cast") : count}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function StopVote({ state, onCastStopVote }: { state: GameState; onCastStopVote: (stop: boolean) => void }) {
  const t = useT();
  const vote = state.stopVote!;
  const voted = vote.youVoted !== null && vote.youVoted !== undefined;
  return (
    <VoteCard title={t("vote.stopTitle")} count={t("vote.stopCount", { n: vote.stopVotes, total: vote.humans })} voted={voted}>
      <Button data-testid="vote-stop-no" variant="ghost" size="sm" onClick={() => onCastStopVote(false)} disabled={voted}>
        {t("vote.keepPlaying")}
      </Button>
      <Button data-testid="vote-stop-yes" variant="danger" size="sm" onClick={() => onCastStopVote(true)} disabled={voted}>
        {t("vote.stopHere")}
      </Button>
    </VoteCard>
  );
}

function PauseVote({ state, onCastPauseVote }: { state: GameState; onCastPauseVote: (pause: boolean) => void }) {
  const t = useT();
  const vote = state.pauseVote!;
  const voted = vote.youVoted !== null && vote.youVoted !== undefined;
  return (
    <VoteCard title={t("vote.pauseTitle")} count={t("vote.pauseCount", { n: vote.pauseVotes, total: vote.humans })} voted={voted}>
      <Button data-testid="vote-pause-no" variant="ghost" size="sm" onClick={() => onCastPauseVote(false)} disabled={voted}>
        {t("vote.keepPlaying")}
      </Button>
      <Button data-testid="vote-pause-yes" size="sm" onClick={() => onCastPauseVote(true)} disabled={voted}>
        {t("vote.pause")}
      </Button>
    </VoteCard>
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
    <Dialog open>
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-sm font-medium text-muted-fg">{t("pause.title")}</p>
        <p className="text-6xl font-semibold tabular-nums">
          {mm}:{ss}
        </p>
        <Button data-testid="resume-now" onClick={onResume} className="w-full">
          {t("pause.resumeNow")}
        </Button>
        <p className="text-xs text-muted-fg">{t("pause.orType")}</p>
      </div>
    </Dialog>
  );
}

function RankingRow({
  rank,
  name,
  value,
  you,
  extra,
  testId,
}: {
  rank: number;
  name: string;
  value: React.ReactNode;
  you: boolean;
  extra?: React.ReactNode;
  testId?: string;
}) {
  return (
    <li data-testid={testId} className={cn("flex h-9 items-center gap-3 rounded-lg px-3 text-sm", rank === 1 ? "bg-gold-soft/10" : "odd:bg-white/[0.02]")}>
      <span className={cn("w-4 tabular-nums", rank === 1 ? "text-gold-soft" : "text-muted-fg")}>{rank}</span>
      <span className={cn("min-w-0 flex-1 truncate", you && "font-semibold")}>{name}</span>
      {extra}
      <span className="w-12 text-right tabular-nums">{value}</span>
    </li>
  );
}

function RoundIntermission({ state }: { state: GameState }) {
  const t = useT();
  const next = state.nextContract;
  const recap = state.lastRound;
  const dealerName = state.players[state.dealer ?? 0]?.name;
  return (
    <div>
      {recap && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-muted-fg">
            {t("intermission.roundResults", { contract: contractName(t, recap.contract) })}
          </p>
          <ol>
            {recap.ranking.map((r) => (
              <RankingRow
                key={r.seat}
                rank={r.rank}
                name={r.name}
                you={r.seat === state.yourSeat}
                value={<span className={r.points > 0 ? "text-success" : r.points < 0 ? "text-danger" : "text-muted-fg"}>{signed(r.points)}</span>}
              />
            ))}
          </ol>
        </div>
      )}
      <div className="text-center">
        <p className="text-xs font-medium text-muted-fg">{recap ? t("intermission.nextRound") : t("intermission.firstRound")}</p>
        <p className="mt-1 text-2xl font-semibold text-gold-soft">{next ? contractName(t, next) : "…"}</p>
        {dealerName && <p className="mt-1 text-xs text-muted-fg">{t("intermission.deals", { name: dealerName })}</p>}
      </div>
    </div>
  );
}

function GameOver({ state, rankedResults }: { state: GameState; rankedResults: RankedMessagesRankedResultEntry[] | null }) {
  const t = useT();
  const standings = state.standings ?? [];
  const eloBySeat = new Map((rankedResults ?? []).map((e) => [e.seat, e]));
  return (
    <div data-testid="final-standings">
      <h2 className="mb-4 text-center text-lg font-semibold">{t("over.finalStandings")}</h2>
      <ol>
        {standings.map((s) => {
          const elo = eloBySeat.get(s.seat);
          return (
              <RankingRow
                key={s.seat}
                testId="standing-row"
                rank={s.rank}
                name={s.name}
                you={s.seat === state.yourSeat}
                value={<span className="font-semibold">{num(s.total)}</span>}
                extra={
                  elo && (
                    <span className="text-xs tabular-nums text-muted-fg" title="ELO">
                      {elo.ratingAfter}{" "}
                      <span className={elo.delta >= 0 ? "text-success" : "text-danger"}>({signed(elo.delta)})</span>
                    </span>
                  )
                }
              />
          );
        })}
      </ol>
      <Button className="mt-5 w-full" onClick={() => window.location.reload()}>
        {t("over.newGame")}
      </Button>
    </div>
  );
}
