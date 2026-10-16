"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { GameState } from "../lib/game";
import {
  fitMeldWidth,
  meldKind,
  MELD_STEP,
  meldTapMoves,
  moveCard,
  openingTotal,
  OPENING_MIN,
  penalty,
  sortRamiHand,
  type RamiCardT,
  type RamiMeldT,
  type RamiMove,
} from "../lib/rami";
import { useT } from "../lib/i18n";
import { cn } from "../lib/cn";
import { fanIndexAt, fanLayout } from "../lib/fan";
import { useElementSize } from "../lib/useElementSize";
import Card, { CARD_RATIO } from "../ui/Card";
import Button from "../ui/Button";
import {
  freeArea,
  GameOver,
  NARROW_FELT,
  num,
  opponents,
  OpponentStrip,
  Overlay,
  PauseOverlay,
  PauseVote,
  StopVote,
  RankingRow,
  SeatsAround,
  TurnTimerBar,
} from "./GameTable";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function RamiTable({
  state,
  error,
  onPlay,
  onCastPauseVote,
  onCastStopVote,
  onResume,
}: {
  state: GameState;
  error: string | null;
  onPlay: (move: RamiMove) => void;
  onCastPauseVote: (pause: boolean) => void;
  onCastStopVote: (stop: boolean) => void;
  onResume: () => void;
}) {
  const t = useT();
  const rami = state.rami;
  const you = state.yourSeat ?? 0;
  const hand = rami?.yourHand ?? [];
  const yourTurn = state.phase === "PLAYING" && state.currentActor === you;
  const turnPhase = yourTurn ? rami?.turnPhase : undefined;
  const opened = Boolean(rami?.opened?.[you]);
  const mustPlay = new Set(rami?.mustPlay ?? []);

  const [selected, setSelected] = useState<number[]>([]);
  const [draft, setDraft] = useState<number[][]>([]);
  const [sortBy, setSortBy] = useState<"suit" | "rank" | "manual">("suit");
  const [manual, setManual] = useState<number[]>([]);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [choice, setChoice] = useState<RamiMove[] | null>(null);
  // A message dismissed once must show again if it comes back after a fresh state cleared it.
  if (!error && dismissed) setDismissed(null);
  // A turn that ended without us (timeout, round over) must not hand its draft to the next one.
  const turnKey = `${state.roundNumber}:${yourTurn}`;
  const [lastTurnKey, setLastTurnKey] = useState(turnKey);
  if (turnKey !== lastTurnKey) {
    setLastTurnKey(turnKey);
    setSelected([]);
    setDraft([]);
    setChoice(null);
  }

  // A hand that grew by exactly one card was drawn into; deals and joker swaps don't qualify.
  const handKey = hand.map((c) => c.id).join(",");
  const [prevHand, setPrevHand] = useState({ key: handKey, ids: hand.map((c) => c.id) });
  const [drawn, setDrawn] = useState<number | null>(null);
  if (handKey !== prevHand.key) {
    const fresh = hand.filter((c) => !prevHand.ids.includes(c.id));
    setDrawn(fresh.length === 1 && hand.length === prevHand.ids.length + 1 ? fresh[0].id : null);
    setPrevHand({ key: handKey, ids: hand.map((c) => c.id) });
  }

  // Derived at render: cards that left the hand (played, turn reset) fall out of the selection/draft.
  const byId = new Map(hand.map((c) => [c.id, c]));
  const groups = turnPhase === "PLAY" && !opened ? draft.map((g) => g.filter((id) => byId.has(id))).filter((g) => g.length) : [];
  const inDraft = new Set(groups.flat());
  const sel = turnPhase === "PLAY" ? selected.filter((id) => byId.has(id) && !inDraft.has(id)) : [];
  const selCards = sel.map((id) => byId.get(id)!);
  const groupCards = groups.map((g) => g.map((id) => byId.get(id)!));
  const draftTotal = openingTotal(groupCards);
  const inHand = hand.filter((c) => !inDraft.has(c.id));
  // Manual order keeps the player's arrangement; cards drawn since then go to the right.
  const shown =
    sortBy === "manual"
      ? [
          ...manual.map((id) => inHand.find((c) => c.id === id)).filter((c): c is RamiCardT => c !== undefined),
          ...sortRamiHand(inHand.filter((c) => !manual.includes(c.id)), "suit"),
        ]
      : sortRamiHand(inHand, sortBy);

  // Selection and draft survive a rejected move: played cards drop out of them on the next state.
  const send = (move: RamiMove) => {
    setChoice(null);
    if (move.kind === "reset") {
      setSelected([]);
      setDraft([]);
    }
    onPlay(move);
  };
  const toggle = (id: number) => {
    setChoice(null);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s.filter((x) => byId.has(x)), id]));
  };
  const keepsACard = (n: number) => n < hand.length;

  const onMeldClick = (meld: RamiMeldT) => {
    if (!opened || selCards.length === 0) return;
    const moves = meldTapMoves(meld, selCards, hand.length);
    if (moves.length === 1) send(moves[0]);
    else if (moves.length > 1) setChoice(moves);
  };

  const hint = !yourTurn
    ? null
    : turnPhase === "DRAW"
      ? t("rami.hintDraw")
      : mustPlay.size > 0
        ? t("rami.hintMustPlay")
        : !opened
          ? t("rami.hintOpen")
          : sel.length > 0
            ? t("rami.hintLayOff")
            : t("rami.hintPlay");

  const showError = error && error !== dismissed;

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <Felt
          state={state}
          canDraw={turnPhase === "DRAW"}
          canTakeDiscard={turnPhase === "DRAW" && hand.length > 1 && Boolean(rami?.discardTop)}
          meldsClickable={turnPhase === "PLAY" && opened && sel.length > 0}
          onDraw={(source) => send({ kind: "draw", source })}
          onMeldClick={onMeldClick}
        />

        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex flex-col items-center gap-2 px-3">
          {state.stopVote?.open && <StopVote state={state} onCastStopVote={onCastStopVote} />}
          {state.pauseVote?.open && <PauseVote state={state} onCastPauseVote={onCastPauseVote} />}
          {showError && (
            <button
              type="button"
              data-testid="rami-error"
              onClick={() => setDismissed(error)}
              className="animate-fade-in pointer-events-auto max-w-sm rounded-lg border border-danger/40 bg-surface-2/95 px-3 py-2 text-sm text-danger shadow-xl"
            >
              {error}
            </button>
          )}
        </div>

        {state.phase === "CONTRACT_SELECTION" && (
          <Overlay>
            <RamiIntermission state={state} />
          </Overlay>
        )}
        {state.phase === "GAME_OVER" && (
          <Overlay>
            <GameOver state={state} rankedResults={null} />
          </Overlay>
        )}
      </div>

      <div
        data-testid="your-hand"
        className="relative shrink-0 border-t border-border bg-surface/80 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:px-4"
      >
        {yourTurn && typeof state.turnDeadlineEpochMs === "number" && (
          <TurnTimerBar deadline={state.turnDeadlineEpochMs} className="bottom-auto top-0" />
        )}
        <div className="flex min-h-11 flex-wrap items-center gap-2 py-1.5">
          <span className={cn("min-w-0 truncate text-sm", yourTurn ? "font-semibold text-gold-soft" : "text-muted-fg")}>
            {state.phase !== "PLAYING" ? (state.players[you]?.name ?? "") : yourTurn ? t("table.yourTurn") : t("table.waiting")}
          </span>
          {hint && <span className="order-last w-full truncate text-xs text-muted-fg sm:order-none sm:w-auto">{hint}</span>}
          <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-fg">
            {(["suit", "rank", "manual"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSortBy(k)}
                className={cn("rounded px-1.5 py-0.5", sortBy === k ? "bg-surface-2 text-foreground" : "hover:text-foreground")}
              >
                {t(k === "suit" ? "rami.sortSuit" : k === "rank" ? "rami.sortRank" : "rami.sortManual")}
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold tabular-nums text-foreground" title={t("table.total")}>
              {num(state.totals?.[you] ?? 0)}
            </span>
          </span>
        </div>

        {yourTurn && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {turnPhase === "DRAW" && (
              <>
                <Button data-testid="rami-draw" size="sm" onClick={() => send({ kind: "draw", source: "STOCK" })}>
                  {t("rami.draw")}
                </Button>
                <Button
                  data-testid="rami-take-discard"
                  size="sm"
                  variant="ghost"
                  disabled={hand.length <= 1 || !rami?.discardTop}
                  onClick={() => send({ kind: "draw", source: "DISCARD" })}
                >
                  {t("rami.takeDiscard")}
                </Button>
              </>
            )}
            {turnPhase === "PLAY" && choice && (
              <>
                {choice.map((move, i, all) => {
                  const bothEnds = all.filter((m) => m.kind === "layoff").length > 1;
                  return (
                  <Button
                    key={i}
                    data-testid={`rami-choose-${move.kind === "swapJoker" ? "swap" : move.kind === "layoff" && move.before.length ? "start" : "end"}`}
                    size="sm"
                    variant={i === 0 ? undefined : "ghost"}
                    onClick={() => send(move)}
                  >
                    {move.kind === "swapJoker"
                      ? t("rami.swapJoker")
                      : !bothEnds
                        ? t("rami.layOff")
                        : move.kind === "layoff" && move.before.length
                          ? t("rami.layOffStart")
                          : t("rami.layOffEnd")}
                  </Button>
                  );
                })}
                <Button size="sm" variant="ghost" onClick={() => setChoice(null)}>
                  <X size={14} />
                </Button>
              </>
            )}
            {turnPhase === "PLAY" && !choice && (
              <>
                {!opened && (
                  <>
                    <Button
                      data-testid="rami-add-draft"
                      size="sm"
                      variant="ghost"
                      disabled={meldKind(selCards) === null}
                      onClick={() => {
                        setDraft([...groups, sel]);
                        setSelected([]);
                      }}
                    >
                      {t("rami.addToDraft")}
                    </Button>
                    <Button
                      data-testid="rami-open"
                      size="sm"
                      disabled={draftTotal < OPENING_MIN || !groupCards.some((g) => meldKind(g) === "RUN") || !keepsACard(inDraft.size)}
                      onClick={() => send({ kind: "open", melds: groups })}
                    >
                      {t("rami.open", { n: draftTotal })}
                    </Button>
                  </>
                )}
                {opened && (
                  <Button
                    data-testid="rami-meld"
                    size="sm"
                    variant="ghost"
                    disabled={meldKind(selCards) === null || !keepsACard(selCards.length)}
                    onClick={() => send({ kind: "meld", cards: sel })}
                  >
                    {t("rami.meld")}
                  </Button>
                )}
                <Button
                  data-testid="rami-discard"
                  size="sm"
                  disabled={sel.length !== 1 || mustPlay.size > 0}
                  onClick={() => send({ kind: "discard", cardId: sel[0] })}
                >
                  {t("rami.discardCard")}
                </Button>
                <Button data-testid="rami-reset" size="sm" variant="ghost" onClick={() => send({ kind: "reset" })}>
                  {t("rami.reset")}
                </Button>
              </>
            )}
          </div>
        )}

        {groups.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {groupCards.map((g, i) => (
              <div key={i} className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1">
                <MiniRow cards={g} width={30} />
                <button
                  type="button"
                  aria-label={t("rami.clearDraft")}
                  onClick={() => setDraft(groups.filter((_, j) => j !== i))}
                  className="grid h-6 w-6 place-items-center rounded text-muted-fg hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Hand
          hand={shown}
          onReorder={(id, to) => {
            setManual(moveCard(shown.map((c) => c.id), id, to));
            setSortBy("manual");
          }}
          selectable={turnPhase === "PLAY"}
          selected={sel}
          highlighted={mustPlay}
          drawn={drawn}
          onToggle={toggle}
        />
      </div>

      {state.paused?.active && <PauseOverlay endsAtMs={state.paused.endsAtMs} onResume={onResume} />}
    </div>
  );
}

function Felt({
  state,
  canDraw,
  canTakeDiscard,
  meldsClickable,
  onDraw,
  onMeldClick,
}: {
  state: GameState;
  canDraw: boolean;
  canTakeDiscard: boolean;
  meldsClickable: boolean;
  onDraw: (source: "STOCK" | "DISCARD") => void;
  onMeldClick: (meld: RamiMeldT) => void;
}) {
  const t = useT();
  const [ref, size] = useElementSize<HTMLDivElement>();
  const others = opponents(state);
  const ready = size.width > 0;
  const narrow = ready && size.width < NARROW_FELT;
  const area = ready && !narrow ? freeArea(size, state) : null;
  const rami = state.rami;
  const melds = rami?.melds ?? [];
  const owners = state.players.filter((p) => melds.some((m) => m.owner === p.seat));
  // Without a free area the column is inset by 8px on every side.
  const box = area ? { width: area.w, height: area.h } : { width: size.width - 16, height: size.height - 16 };
  const cw = fitMeldWidth(box, owners.map((p) => melds.filter((m) => m.owner === p.seat).map((m) => m.cards.length)));
  const pw = cw * 1.2;

  return (
    <div className="flex h-full flex-col gap-2 p-2 sm:p-4">
      {narrow && <OpponentStrip state={state} players={others} />}
      <div
        ref={ref}
        className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/[0.06] bg-[radial-gradient(ellipse_at_50%_40%,var(--color-felt),var(--color-felt-deep)_75%)] shadow-[inset_0_0_0_6px_rgba(0,0,0,0.12),inset_0_0_80px_rgba(0,0,0,0.35)]"
      >
        {ready && !narrow && <SeatsAround state={state} players={others} size={size} />}
        {ready && rami?.turnPhase && (
          <div
            className="absolute flex flex-col items-center gap-3 overflow-y-auto p-2"
            style={area ? { left: area.x, top: area.y, width: area.w, height: area.h } : { inset: 8 }}
          >
            <div className="flex items-end gap-4">
              <button
                type="button"
                data-testid="rami-stock"
                disabled={!canDraw}
                onClick={() => onDraw("STOCK")}
                className={cn("flex flex-col items-center gap-1 text-xs text-white/60", canDraw && "cursor-pointer hover:text-white")}
              >
                <span
                  style={{ width: pw, height: Math.round(pw * CARD_RATIO) }}
                  className={cn(
                    "grid place-items-center rounded-[0.32em] bg-[repeating-linear-gradient(45deg,#3a2f1d,#3a2f1d_4px,#2c2416_4px,#2c2416_8px)] ring-1 ring-black/30",
                    canDraw && "ring-2 ring-gold-soft",
                  )}
                >
                  <span className="text-sm font-semibold tabular-nums text-gold-soft">{rami.stockCount}</span>
                </span>
                {t("rami.stock")}
              </button>
              <Clickable
                testId="rami-discard-pile"
                enabled={canTakeDiscard}
                onActivate={() => onDraw("DISCARD")}
                className="flex flex-col items-center gap-1 text-xs text-white/60"
              >
                {rami.discardTop ? (
                  <span className="pointer-events-none">
                    <Card card={rami.discardTop} width={pw} highlight={canTakeDiscard} />
                  </span>
                ) : (
                  <span style={{ width: pw, height: Math.round(pw * CARD_RATIO) }} className="rounded-[0.32em] border border-dashed border-white/20" />
                )}
                {t("rami.discard")}
              </Clickable>
            </div>

            {melds.length === 0 ? (
              <p className="text-xs text-white/40">{t("rami.noMelds")}</p>
            ) : (
              <div className="flex w-full flex-col gap-2">
                {owners.map((p) => (
                  <div key={p.seat} className="flex flex-wrap items-center gap-2">
                    <span className="w-full truncate text-[11px] text-white/50">{p.name}</span>
                    {melds
                      .filter((m) => m.owner === p.seat)
                      .map((m) => (
                        <Clickable
                          key={m.id}
                          testId="rami-meld-on-table"
                          enabled={meldsClickable}
                          onActivate={() => onMeldClick(m)}
                          className={cn(
                            "rounded-lg p-1 transition-colors",
                            meldsClickable ? "cursor-pointer bg-white/[0.06] ring-1 ring-gold-soft/40 hover:bg-white/[0.12]" : "bg-black/15",
                          )}
                        >
                          <MiniRow cards={m.cards} width={cw} />
                        </Clickable>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** A clickable area that may contain cards (themselves buttons), so it cannot be a <button>. */
function Clickable({
  testId,
  enabled,
  onActivate,
  className,
  children,
}: {
  testId: string;
  enabled: boolean;
  onActivate: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      data-testid={testId}
      tabIndex={enabled ? 0 : -1}
      aria-disabled={!enabled}
      onClick={enabled ? onActivate : undefined}
      onKeyDown={(e) => {
        if (enabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onActivate();
        }
      }}
      className={cn(className, enabled && "cursor-pointer", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft")}
    >
      {children}
    </div>
  );
}

function MiniRow({ cards, width }: { cards: RamiCardT[]; width: number }) {
  const step = width * MELD_STEP;
  return (
    // Display-only cards: their disabled buttons would otherwise swallow taps meant for the meld.
    <span
      className="pointer-events-none relative block"
      style={{ width: width + (cards.length - 1) * step, height: Math.round(width * CARD_RATIO) }}
    >
      {cards.map((c, i) => (
        <span key={c.id} className="absolute top-0" style={{ left: i * step, zIndex: i }}>
          <Card card={c} width={width} />
        </span>
      ))}
    </span>
  );
}

const DRAG_THRESHOLD = 6;

function Hand({
  hand,
  selectable,
  selected,
  highlighted,
  drawn,
  onToggle,
  onReorder,
}: {
  hand: RamiCardT[];
  selectable: boolean;
  selected: number[];
  highlighted: Set<number>;
  drawn: number | null;
  onToggle: (id: number) => void;
  onReorder: (id: number, toIndex: number) => void;
}) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [drag, setDrag] = useState<{ id: number; startX: number; startY: number; dx: number; dy: number } | null>(null);
  const moved = (d: { dx: number; dy: number }) => Math.hypot(d.dx, d.dy) > DRAG_THRESHOLD;
  // A drag ends with a click on the card; that click must not toggle the selection.
  const justDragged = useRef(false);
  const narrow = size.width > 0 && size.width < NARROW_FELT;
  const cw = Math.round(narrow ? clamp(size.width / 6.4, 50, 64) : clamp(size.width / 12, 64, 84));
  const ch = cw * CARD_RATIO;
  const minStep = narrow ? 22 : 26;
  const fan = fanLayout(hand.length, cw, size.width, cw * 0.62, minStep);
  // Reserve two rows so the bar doesn't jump as the hand grows and shrinks around 14 cards.
  const reservedRows = fanLayout(15, cw, size.width, cw * 0.62, minStep).rows;
  const rowOffset = ch * 0.5;
  const lift = 14;
  const height = ch + (reservedRows - 1) * rowOffset + lift;

  return (
    <div
      ref={ref}
      className="relative"
      style={{ height: size.width ? height : ch + lift }}
      onPointerMove={(e) => {
        if (!drag) return;
        const next = { ...drag, dx: e.clientX - drag.startX, dy: e.clientY - drag.startY };
        // Capture only once it is a drag: a captured tap would send its click here, not to the card.
        if (moved(next) && !e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        setDrag(next);
      }}
      onPointerUp={(e) => {
        if (drag && moved(drag)) {
          justDragged.current = true;
          setTimeout(() => (justDragged.current = false), 0);
          const box = e.currentTarget.getBoundingClientRect();
          const geo = { count: hand.length, cardWidth: cw, width: size.width, top: lift, rowOffset };
          onReorder(drag.id, fanIndexAt(e.clientX - box.left, e.clientY - box.top, fan, geo));
        }
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)}
    >
      {size.width > 0 &&
        hand.map((card, i) => {
          const row = fan.rows === 2 && i >= fan.perRow ? 1 : 0;
          const inRow = row ? i - fan.perRow : i;
          const rowCount = row ? hand.length - fan.perRow : Math.min(fan.perRow, hand.length);
          const rowWidth = cw + (rowCount - 1) * fan.step;
          const isSelected = selected.includes(card.id);
          const dragging = drag?.id === card.id && moved(drag);
          return (
            <div
              key={card.id}
              data-testid="rami-hand-card"
              data-card-id={card.id}
              data-penalty={penalty(card)}
              className={cn(
                "absolute touch-none hover:z-50",
                card.id === drawn && "animate-drawn",
                dragging ? "z-[60] cursor-grabbing" : "transition-[left,top] duration-200 ease-out motion-reduce:transition-none",
              )}
              style={{
                left: (size.width - rowWidth) / 2 + inRow * fan.step + (dragging ? drag.dx : 0),
                top: lift + (fan.rows === 2 ? row * rowOffset : ((reservedRows - 1) * rowOffset) / 2) + (dragging ? drag.dy : 0),
                zIndex: dragging ? 60 : i + 1,
              }}
              onPointerDown={(e) => setDrag({ id: card.id, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 })}
            >
              <Card
                card={card}
                width={cw}
                playable={selectable}
                raised={isSelected}
                highlight={isSelected || highlighted.has(card.id)}
                onClick={selectable ? () => !justDragged.current && onToggle(card.id) : undefined}
                className="disabled:pointer-events-none"
              />
            </div>
          );
        })}
    </div>
  );
}

function RamiIntermission({ state }: { state: GameState }) {
  const t = useT();
  const recap = state.rami?.lastRound;
  const n = state.playerCount;
  const nextDealer = state.roundNumber ? ((state.dealer ?? 0) + 1) % n : 0;
  const rows = recap
    ? state.players
        .map((p) => ({ seat: p.seat, name: p.name, points: recap.penalties[p.seat] ?? 0 }))
        .sort((a, b) => a.points - b.points || a.seat - b.seat)
    : [];
  const winnerName = recap?.winner !== null && recap?.winner !== undefined ? state.players[recap.winner]?.name : null;
  return (
    <div data-testid="rami-intermission">
      {recap && (
        <div className="mb-5">
          <p className="text-center text-sm font-semibold">{t("rami.roundOver")}</p>
          <p className="mt-1 text-center text-xs text-muted-fg">
            {winnerName ? t("rami.winner", { name: winnerName }) : t("rami.noWinner")}
          </p>
          {recap.ramiSec && (
            <p data-testid="rami-sec" className="mt-2 rounded-md bg-gold-soft/15 py-1 text-center text-sm font-semibold text-gold-soft">
              {t("rami.ramiSec")}
            </p>
          )}
          <p className="mb-2 mt-4 text-xs font-medium text-muted-fg">{t("rami.penalties")}</p>
          <ol>
            {rows.map((r, i) => (
              <RankingRow
                key={r.seat}
                rank={i + 1}
                name={r.name}
                you={r.seat === state.yourSeat}
                value={<span className={r.points > 0 ? "text-danger" : "text-muted-fg"}>{r.points > 0 ? `+${r.points}` : "0"}</span>}
              />
            ))}
          </ol>
        </div>
      )}
      <div className="text-center">
        <p className="text-xs font-medium text-muted-fg">{recap ? t("rami.nextRound") : t("rami.firstRound")}</p>
        <p className="mt-1 text-xs text-muted-fg">{t("intermission.deals", { name: state.players[nextDealer]?.name ?? "" })}</p>
      </div>
    </div>
  );
}
