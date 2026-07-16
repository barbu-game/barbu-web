"use client";

import { use, useEffect, useRef, useState } from "react";
import AudioControls from "./components/AudioControls";
import AuthBar from "./components/AuthBar";
import FullscreenToggle from "./components/FullscreenToggle";
import LocaleSwitcher from "./ui/LocaleSwitcher";
import ChatPanel from "./components/ChatPanel";
import GameTable from "./components/GameTable";
import Leaderboard from "./components/Leaderboard";
import { Home, RoomLobby, Searching } from "./components/Lobby";
import { audio } from "./lib/audio";
import { useAuth } from "./lib/auth";
import { useLocale } from "./lib/i18n";
import { cardsOnTable } from "./lib/game";
import { useGameSocket } from "./lib/useGameSocket";
import { saveSession, loadSession, clearSession } from "./lib/session";
import { installReconnect } from "./lib/reconnect";
import { createRetryScheduler, type RetryScheduler } from "./lib/retryLoop";
import { nextBackoffDelay } from "./lib/backoff";
import { deriveConnectionPhase } from "./lib/connectionPhase";
import ConnectionToast from "./components/ConnectionToast";
import { fetchVariants, type Variant } from "./lib/variants";

export default function Page({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const { join } = use(searchParams);
  const game = useGameSocket();
  const auth = useAuth();
  const { locale } = useLocale();
  const [variants, setVariants] = useState<Variant[]>([]);

  // Re-fetch when the locale changes: the rule text is localised server-side, so the toggle
  // must reload /variants to update the rules card.
  useEffect(() => {
    fetchVariants(locale)
      .then(setVariants)
      .catch(() => setVariants([]));
  }, [locale]);

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

  // Try to resume the game in progress on load (the login token is already synced by the effect
  // above; the account re-authenticates, the guest presents their resume token).
  const resumeTried = useRef(false);
  useEffect(() => {
    if (resumeTried.current) return;
    resumeTried.current = true;
    const stored = loadSession();
    if (stored) game.resume(stored.resumeToken);
    // on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume when returning to the app: on mobile, leaving the tab (e.g. to share the invite link)
  // suspends the page and kills the WebSocket without reloading. Since the mount effect above does
  // not replay, we fire a `resume` as soon as the tab becomes visible again or the network comes
  // back, as long as the socket is dead and a session is stored.
  const { resume, status } = game;
  useEffect(
    () =>
      installReconnect({
        isVisible: () => document.visibilityState === "visible",
        isSocketOpen: () => status === "open",
        loadSession,
        resume,
      }),
    [status, resume],
  );

  // Active reconnection: as long as the tab stays open and a game session is stored, we replay
  // `resume` with a jittered backoff every time the socket drops. Complements installReconnect
  // (which only reacts to visibility / network returning). resume and status are read via refs to
  // keep the scheduler stable across the component's whole lifetime.
  const resumeRef = useRef(resume);
  const statusRef = useRef(status);
  useEffect(() => {
    resumeRef.current = resume;
    statusRef.current = status;
  });
  const retryRef = useRef<RetryScheduler | null>(null);
  useEffect(() => {
    const scheduler = createRetryScheduler({
      loadSession,
      resume: (token) => resumeRef.current(token),
      isSocketOpen: () => statusRef.current === "open",
      delayFor: nextBackoffDelay,
    });
    retryRef.current = scheduler;
    return () => {
      scheduler.stop();
      retryRef.current = null;
    };
  }, []);
  useEffect(() => {
    const scheduler = retryRef.current;
    if (!scheduler) return;
    if (status === "closed") scheduler.onClosed();
    else if (status === "open") scheduler.onOpen();
  }, [status]);

  // Persist the session as long as we hold a live seat; purge at end of game.
  useEffect(() => {
    const s = game.state;
    if (s && s.resumeToken && s.roomId && s.yourSeat !== undefined && s.yourSeat !== null) {
      saveSession({ roomId: s.roomId, seat: s.yourSeat, resumeToken: s.resumeToken });
    }
    if (s && s.phase === "GAME_OVER") clearSession();
  }, [game.state]);

  // Stale session (room GC'd, seat already reclaimed…) → purge it.
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
    content = (
      <RoomLobby
        state={game.state}
        onAddBot={game.addBot}
        onStart={game.start}
        onRenameBot={game.renameBot}
        onLeave={() => {
          clearSession();
          game.leave();
        }}
      />
    );
  } else {
    content = (
      <GameTable
        state={game.state}
        variants={variants}
        rankedResults={game.rankedResults}
        onPlay={game.play}
        onCastStopVote={game.castStopVote}
        onCastPauseVote={game.castPauseVote}
        onResume={game.resumeGame}
      />
    );
  }

  return (
    <main className="min-h-dvh px-4 py-4 text-foreground sm:px-6">
      <div className="fixed right-4 top-4 z-[60] flex items-center gap-2">
        <LocaleSwitcher />
        <FullscreenToggle />
        <AudioControls />
      </div>
      {content}
      <ConnectionToast
        phase={deriveConnectionPhase({
          isOpen: game.status === "open",
          hasSession: game.state !== null && game.state.phase !== "GAME_OVER",
          resumeUnavailable: game.resumeUnavailable,
        })}
      />
      {game.roomId && (
        <div className="mx-auto mt-6 w-full max-w-5xl">
          <ChatPanel
            messages={game.messages}
            onSend={(text) => {
              const cmd = text.trim().toLowerCase();
              if (cmd === "/pause") {
                game.castPauseVote(true);
              } else if (cmd === "/resume") {
                game.resumeGame();
              } else {
                game.sendChat(text);
              }
            }}
            disabled={game.seat === null}
          />
        </div>
      )}
    </main>
  );
}
