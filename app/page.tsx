"use client";

import { use, useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import AppHeader, { Brand } from "./components/AppHeader";
import AccountButton from "./components/AuthBar";
import ChatPanel from "./components/ChatPanel";
import GameTable, { GameHeaderInfo, RulesButton } from "./components/GameTable";
import RamiTable from "./components/RamiTable";
import LeaderboardButton from "./components/Leaderboard";
import SettingsMenu from "./components/SettingsMenu";
import Dialog from "./ui/Dialog";
import IconButton from "./ui/IconButton";
import { Home, RoomLobby, Searching } from "./components/Lobby";
import { audio } from "./lib/audio";
import { useAuth } from "./lib/auth";
import { useLocale, useT } from "./lib/i18n";
import { useMediaQuery } from "./lib/useElementSize";
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
  const t = useT();
  const [variants, setVariants] = useState<Variant[]>([]);

  // Rule text is localised server-side, so reload /variants when the locale changes.
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

  // Keep the socket's auth token in step with the session (incl. after a refresh).
  // setAuthToken only writes a ref, so calling it from an effect triggers no re-render.
  const { setAuthToken } = game;
  useEffect(() => {
    setAuthToken(auth?.token ?? null);
  }, [auth, setAuthToken]);

  // Resume a game in progress on load: the account re-authenticates, the guest presents its
  // resume token.
  const resumeTried = useRef(false);
  useEffect(() => {
    if (resumeTried.current) return;
    resumeTried.current = true;
    const stored = loadSession();
    if (stored) game.resume(stored.resumeToken);
    // on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume when returning to the app: mobile backgrounding kills the WebSocket without reloading,
  // and the mount effect above does not replay.
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

  // Active reconnection while the tab stays open: replay resume with a jittered backoff on every
  // socket drop. Complements the visibility/network-triggered reconnect. resume and status are
  // read via refs to keep the scheduler stable for the component's lifetime.
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

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [asideOpen, setAsideOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const chatCount = game.messages.filter((m) => !m.system).length;
  const chatVisible = isDesktop ? asideOpen : sheetOpen;
  const [seenCount, setSeenCount] = useState(0);
  const unread = chatVisible ? 0 : Math.max(0, chatCount - seenCount);
  const toggleChat = () => {
    setSeenCount(chatCount);
    if (isDesktop) setAsideOpen((o) => !o);
    else setSheetOpen((o) => !o);
  };

  const sendChat = (text: string) => {
    const cmd = text.trim().toLowerCase();
    if (cmd === "/pause") game.castPauseVote(true);
    else if (cmd === "/resume") game.resumeGame();
    else game.sendChat(text);
  };

  const inGame = game.state !== null && game.state.phase !== "LOBBY";

  let content;
  if (!game.state && game.searching) {
    content = <Searching onCancel={game.cancelMatch} />;
  } else if (!game.state) {
    content = (
      <Home
        onCreate={game.createRoom}
        onJoin={game.join}
        onQuickMatch={(name, size, gameType) => game.quickMatch(name, size, false, gameType)}
        onRankedMatch={(name, gameType) => game.quickMatch(name, 4, true, gameType)}
        isLoggedIn={auth !== null}
        username={auth?.username ?? null}
        error={game.error}
        status={game.status}
        variants={variants}
        initialCode={(join ?? "").toUpperCase()}
      />
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
  } else if (game.state.gameType === "RAMI") {
    content = (
      <RamiTable
        state={game.state}
        error={game.error}
        onPlay={game.play}
        onCastPauseVote={game.castPauseVote}
        onCastStopVote={game.castStopVote}
        onResume={game.resumeGame}
      />
    );
  } else {
    content = (
      <GameTable
        state={game.state}
        rankedResults={game.rankedResults}
        onPlay={game.play}
        onCastStopVote={game.castStopVote}
        onCastPauseVote={game.castPauseVote}
        onResume={game.resumeGame}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader left={inGame && game.state ? <GameHeaderInfo state={game.state} /> : <Brand />}>
        {inGame && game.state && <RulesButton state={game.state} variants={variants} />}
        {game.roomId ? (
          <IconButton label={t("chat.title")} onClick={toggleChat} active={chatVisible} badge={unread}>
            <MessageSquare size={18} />
          </IconButton>
        ) : (
          <>
            <LeaderboardButton />
            <AccountButton />
          </>
        )}
        <SettingsMenu />
      </AppHeader>
      <div className="flex min-h-0 flex-1">
        <main className="min-h-0 min-w-0 flex-1">{content}</main>
        {game.roomId && asideOpen && (
          <aside className="hidden w-80 shrink-0 border-l border-border lg:flex">
            <ChatPanel className="w-full" messages={game.messages} onSend={sendChat} disabled={game.seat === null} />
          </aside>
        )}
      </div>
      {game.roomId && !isDesktop && (
        <Dialog
          open={sheetOpen}
          onOpenChange={(open) => {
            setSeenCount(chatCount);
            setSheetOpen(open);
          }}
          title={t("chat.title")}
          className="h-[70dvh]"
        >
          <ChatPanel className="h-full" messages={game.messages} onSend={sendChat} disabled={game.seat === null} />
        </Dialog>
      )}
      <ConnectionToast
        phase={deriveConnectionPhase({
          isOpen: game.status === "open",
          hasSession: game.state !== null && game.state.phase !== "GAME_OVER",
          resumeUnavailable: game.resumeUnavailable,
        })}
      />
    </div>
  );
}
