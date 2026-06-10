export type Phase = "LOBBY" | "CONTRACT_SELECTION" | "PLAYING" | "GAME_OVER";

export type CardT = { suit: string; rank: string };
export type MoveT = { kind: "card"; suit: string; rank: string } | { kind: "pass" };

export type Player = { seat: number; name: string; bot: boolean; connected: boolean };

export type Standing = { rank: number; seat: number; name: string; total: number };

export type LastRoundRank = { rank: number; seat: number; name: string; points: number };
export type LastRound = { contract: string; ranking: LastRoundRank[] };

export type GameState = {
  type: "state";
  roomId: string;
  playerCount: number;
  yourSeat: number;
  phase: Phase;
  players: Player[];
  dealer?: number;
  roundNumber?: number;
  plannedRounds?: number;
  totals?: number[];
  currentActor?: number;
  contract?: string;
  handCounts?: number[];
  yourHand?: CardT[];
  roundScores?: number[];
  resolving?: boolean;
  trick?: {
    leader: number;
    plays: { seat: number; card: CardT }[];
    complete?: boolean;
    taker?: number;
  };
  board?: Record<string, { opened: boolean; low: number; high: number }>;
  yourLegalMoves?: MoveT[];
  nextContract?: string;
  lastRound?: LastRound;
  standings?: Standing[];
  stopVote?: { open: boolean; humans: number; stopVotes: number; youVoted: boolean | null };
};

export const SUIT_SYMBOL: Record<string, string> = {
  CLUBS: "♣",
  DIAMONDS: "♦",
  HEARTS: "♥",
  SPADES: "♠",
};

const RANK_LABEL: Record<string, string> = {
  TWO: "2", THREE: "3", FOUR: "4", FIVE: "5", SIX: "6", SEVEN: "7",
  EIGHT: "8", NINE: "9", TEN: "10", JACK: "J", QUEEN: "Q", KING: "K", ACE: "A",
};

export const CONTRACT_LABEL: Record<string, string> = {
  NO_TRICKS: "No tricks",
  NO_HEARTS: "No hearts",
  NO_QUEENS: "No queens",
  NO_RED_KINGS: "No red kings",
  MONTANTE: "Montante",
};

export const isRedSuit = (suit: string) => suit === "HEARTS" || suit === "DIAMONDS";

export const rankLabel = (rank: string) => RANK_LABEL[rank] ?? rank;

export const cardKey = (card: CardT) => `${card.suit}-${card.rank}`;

/** Montante column value (1=A .. 13=K) to a short label. */
export function montanteLabel(value: number): string {
  if (value <= 0) return "";
  if (value === 1) return "A";
  if (value === 11) return "J";
  if (value === 12) return "Q";
  if (value === 13) return "K";
  return String(value);
}

export function isCardLegal(state: GameState, card: CardT): boolean {
  return (state.yourLegalMoves ?? []).some(
    (m) => m.kind === "card" && m.suit === card.suit && m.rank === card.rank,
  );
}

export function canPass(state: GameState): boolean {
  return (state.yourLegalMoves ?? []).some((m) => m.kind === "pass");
}

export const isYourTurn = (state: GameState) => state.currentActor === state.yourSeat;

/** Number of cards currently shown on the table — grows by one each time a card is played. */
export function cardsOnTable(state: GameState | null): number {
  if (!state) return 0;
  if (state.trick?.plays) return state.trick.plays.length;
  if (state.board) {
    return Object.values(state.board).reduce((n, c) => n + (c.opened ? c.high - c.low + 1 : 0), 0);
  }
  return 0;
}
