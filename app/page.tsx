"use client";

import { use, useEffect, useRef, useState } from "react";
import AudioControls from "./components/AudioControls";
import AuthBar from "./components/AuthBar";
import FullscreenToggle from "./components/FullscreenToggle";
import ChatPanel from "./components/ChatPanel";
import GameTable from "./components/GameTable";
import Leaderboard from "./components/Leaderboard";
import { Home, RoomLobby, Searching } from "./components/Lobby";
import { audio } from "./lib/audio";
import { useAuth } from "./lib/auth";
import { cardsOnTable } from "./lib/game";
import { useGameSocket } from "./lib/useGameSocket";
import { saveSession, loadSession, clearSession } from "./lib/session";
import { fetchVariants, type Variant } from "./lib/variants";

export default function Page({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const { join } = use(searchParams);
  const game = useGameSocket();
  const auth = useAuth();
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    fetchVariants()
      .then(setVariants)
      .catch(() => setVariants([]));
  }, []);

  const cardCount = cardsOnTable(game.state);
  const previousCardCount = useRef(0);
  useEffect(() => {
    if (cardCount > previousCardCount.current) {
      audio.playCard();
    }
    previousCardCount.current = cardCount;
  }, [cardCount]);

  // Keep the socket's auth token in step with the persisted session (incl. after a refresh).
  // setAuthToken only writes a ref, so calling it from an effect triggers no re-render.
  const { setAuthToken } = game;
  useEffect(() => {
    setAuthToken(auth?.token ?? null);
  }, [auth, setAuthToken]);

  // Tente de reprendre la partie en cours au chargement (le token de login est déjà synchronisé
  // par l'effet ci-dessus ; le compte se ré-authentifie, l'invité présente son resume token).
  const resumeTried = useRef(false);
  useEffect(() => {
    if (resumeTried.current) return;
    resumeTried.current = true;
    const stored = loadSession();
    if (stored) game.resume(stored.resumeToken);
    // au montage uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste la session tant qu'on tient un siège vivant ; purge en fin de partie.
  useEffect(() => {
    const s = game.state;
    if (s && s.resumeToken && s.roomId && s.yourSeat !== undefined && s.yourSeat !== null) {
      saveSession({ roomId: s.roomId, seat: s.yourSeat, resumeToken: s.resumeToken });
    }
    if (s && s.phase === "GAME_OVER") clearSession();
  }, [game.state]);

  // Session périmée (room GC'd, siège déjà repris…) → on purge.
  useEffect(() => {
    if (game.resumeUnavailable) clearSession();
  }, [game.resumeUnavailable]);

  let content;
  if (!game.state && game.searching) {
    content = <Searching onCancel={game.cancelMatch} />;
  } else if (!game.state) {
    content = (
      <>
        <AuthBar />
        <Home
          onCreate={game.createRoom}
          onJoin={game.join}
          onQuickMatch={game.quickMatch}
          onRankedMatch={(name) => game.quickMatch(name, 4, true)}
          isLoggedIn={auth !== null}
          username={auth?.username ?? null}
          error={game.error}
          status={game.status}
          variants={variants}
          initialCode={(join ?? "").toUpperCase()}
        />
        <Leaderboard />
      </>
    );
  } else if (game.state.phase === "LOBBY") {
    content = <RoomLobby state={game.state} onAddBot={game.addBot} onStart={game.start} />;
  } else {
    content = (
      <GameTable
        state={game.state}
        variants={variants}
        rankedResults={game.rankedResults}
        onPlay={game.play}
        onCastStopVote={game.castStopVote}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#134e4a_0%,_#0f172a_55%)] px-4 py-4 text-white sm:px-6">
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <FullscreenToggle />
        <AudioControls />
      </div>
      {content}
      {game.roomId && (
        <div className="mx-auto mt-6 w-full max-w-5xl">
          <ChatPanel messages={game.messages} onSend={game.sendChat} disabled={game.seat === null} />
        </div>
      )}
    </main>
  );
}
