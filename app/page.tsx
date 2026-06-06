"use client";

import { useCallback, useState } from "react";
import AuthBar from "./components/AuthBar";
import GameTable from "./components/GameTable";
import { Home, RoomLobby } from "./components/Lobby";
import type { AuthResult } from "./lib/auth";
import { useGameSocket } from "./lib/useGameSocket";

export default function Page() {
  const game = useGameSocket();
  const [, setAuth] = useState<AuthResult | null>(null);

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
        />
      </>
    );
  } else if (game.state.phase === "LOBBY") {
    content = <RoomLobby state={game.state} onAddBot={game.addBot} onStart={game.start} />;
  } else {
    content = (
      <GameTable
        state={game.state}
        onChooseContract={game.chooseContract}
        onPlay={game.play}
        onCastStopVote={game.castStopVote}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#134e4a_0%,_#0f172a_55%)] text-white">
      {content}
    </main>
  );
}
