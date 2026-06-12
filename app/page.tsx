"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import AudioControls from "./components/AudioControls";
import AuthBar from "./components/AuthBar";
import ChatPanel from "./components/ChatPanel";
import GameTable from "./components/GameTable";
import { Home, RoomLobby } from "./components/Lobby";
import { audio } from "./lib/audio";
import type { AuthResult } from "./lib/auth";
import { cardsOnTable } from "./lib/game";
import { useGameSocket } from "./lib/useGameSocket";
import { fetchVariants, type Variant } from "./lib/variants";

export default function Page({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const { join } = use(searchParams);
  const game = useGameSocket();
  const [, setAuth] = useState<AuthResult | null>(null);
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

  const { setAuthToken } = game;
  const handleAuthChange = useCallback(
    (auth: AuthResult | null) => {
      setAuth(auth);
      setAuthToken(auth?.token ?? null);
    },
    [setAuthToken],
  );

  let content;
  if (!game.state) {
    content = (
      <>
        <AuthBar onAuthChange={handleAuthChange} />
        <Home
          onCreate={game.createRoom}
          onJoin={game.join}
          onQuickMatch={game.quickMatch}
          error={game.error}
          status={game.status}
          variants={variants}
          initialCode={(join ?? "").toUpperCase()}
        />
      </>
    );
  } else if (game.state.phase === "LOBBY") {
    content = <RoomLobby state={game.state} onAddBot={game.addBot} onStart={game.start} />;
  } else {
    content = (
      <GameTable
        state={game.state}
        variants={variants}
        onPlay={game.play}
        onCastStopVote={game.castStopVote}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#134e4a_0%,_#0f172a_55%)] text-white">
      <AudioControls />
      {content}
      {game.roomId && (
        <div className="mx-auto w-full max-w-5xl px-4 pb-4">
          <ChatPanel messages={game.messages} onSend={game.sendChat} disabled={game.seat === null} />
        </div>
      )}
    </main>
  );
}
