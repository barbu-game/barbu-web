"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatBroadcast, RankedMessagesRankedResultEntry } from "@barbu-game/barbu-api";
import type { GameState, MoveT } from "./game";
import { buildPodWsUrl } from "./redirect";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws/game";

type Status = "idle" | "connecting" | "open" | "closed";

export function useGameSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  // Current connection URL (may be rewritten to an owning pod on redirect) and last resume token,
  // replayed identically after a redirect.
  const urlRef = useRef<string>(WS_URL);
  const resumeTokenRef = useRef<string | null>(null);
  // Stable indirection to reopen the socket from a handler (redirect) without a circular dependency.
  const connectRef = useRef<(onReady: () => void) => void>(() => {});
  // Intentional close (redirect/matched): distinguishes a handler-driven handoff from an unwanted
  // drop, so we don't re-enqueue by mistake during a match.
  const intentionalCloseRef = useRef(false);
  // Last matchmaking request + guards: re-enqueue ONCE if the socket drops mid-search (home pod
  // dead → "transparent re-queue" onto a survivor).
  const lastEnqueueRef = useRef<{ name: string; size: number; ranked: boolean } | null>(null);
  const searchingRef = useRef(false);
  const requeuedRef = useRef(false);
  const [state, setState] = useState<GameState | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<ChatBroadcast[]>([]);
  const [rankedResults, setRankedResults] = useState<RankedMessagesRankedResultEntry[] | null>(null);
  const [resumeUnavailable, setResumeUnavailable] = useState(false);
  // In the matchmaking queue: the server doesn't acknowledge, we keep the state locally until a
  // game arrives (message "state"), an error occurs, or the player cancels.
  const [searching, setSearching] = useState(false);

  const send = useCallback((payload: unknown) => {
    wsRef.current?.send(JSON.stringify(payload));
  }, []);

  const ensureSocket = useCallback((onReady: () => void) => {
    const existing = wsRef.current;
    if (existing && existing.readyState === WebSocket.OPEN) {
      onReady();
      return;
    }
    setStatus("connecting");
    setError(null);
    const ws = new WebSocket(urlRef.current);
    wsRef.current = ws;
    ws.onopen = () => {
      setStatus("open");
      onReady();
    };
    ws.onclose = () => {
      if (intentionalCloseRef.current) {
        intentionalCloseRef.current = false;
        return; // handoff driven by the redirect/matched handler: it reopens the socket itself
      }
      setStatus("closed");
      if (searchingRef.current && lastEnqueueRef.current && !requeuedRef.current) {
        // Unwanted drop during the search (home pod dead): a single re-registration attempt onto a
        // surviving pod, then we give up if it drops again (no loop if the server is down).
        requeuedRef.current = true;
        const { name, size, ranked } = lastEnqueueRef.current;
        urlRef.current = WS_URL;
        setTimeout(() => {
          connectRef.current(() => send({ type: "enqueueMatchmaking", name, size, ranked, token: tokenRef.current }));
        }, 1000);
      } else {
        setSearching(false);
      }
    };
    ws.onerror = () => {
      setError("Connection error — is the server running?");
      setSearching(false);
    };
    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        setError("Received a malformed message from the server.");
        return;
      }
      if (msg.type === "joined") {
        setSeat(msg.seat);
        setRoomId(msg.roomId);
        setSearching(false);
        setResumeUnavailable(false);
      } else if (msg.type === "error") {
        setError(msg.message);
        setSearching(false);
      } else if (msg.type === "state") {
        setState(msg as GameState);
        setSearching(false);
        // A fresh state proves we're in a live session: purge any resumeUnavailable left armed from
        // an earlier resume (otherwise the connection toast would show "failed" on a perfectly
        // healthy game).
        setResumeUnavailable(false);
      } else if (msg.type === "chat") {
        setMessages((prev) => [...prev, msg as ChatBroadcast]);
      } else if (msg.type === "rankedResult") {
        setRankedResults(msg.entries as RankedMessagesRankedResultEntry[]);
      } else if (msg.type === "resumeUnavailable") {
        setResumeUnavailable(true);
      } else if (msg.type === "redirect") {
        // The game lives on another pod: we reconnect the socket to it and replay the resume.
        urlRef.current = buildPodWsUrl(WS_URL, msg.pod);
        const token = resumeTokenRef.current;
        intentionalCloseRef.current = true;
        try {
          ws.close();
        } catch {
          // socket already closing; the fresh connect below is what matters
        }
        connectRef.current(() => send({ type: "resume", resumeToken: token, token: tokenRef.current }));
      } else if (msg.type === "matched") {
        // Matchmaking formed a table: the server provides the resume token of the reserved seat (we
        // had none). We only reconnect via /pod/<pod> (routed by Traefik) if the table lives on
        // ANOTHER pod. Otherwise (no `pod`, or the single-instance sentinel "local" = default POD_ID)
        // we claim the seat on the current socket: off-cluster, /pod/<pod> is routed nowhere.
        resumeTokenRef.current = msg.resumeToken;
        if (msg.pod && msg.pod !== "local") {
          urlRef.current = buildPodWsUrl(WS_URL, msg.pod);
          intentionalCloseRef.current = true;
          try {
            ws.close();
          } catch {
            // socket already closing; the fresh connect below is what matters
          }
          connectRef.current(() => send({ type: "resume", resumeToken: msg.resumeToken, token: tokenRef.current }));
        } else {
          send({ type: "resume", resumeToken: msg.resumeToken, token: tokenRef.current });
        }
      }
    };
  }, [send]);

  useEffect(() => {
    connectRef.current = ensureSocket;
  }, [ensureSocket]);

  // Mirror of the `searching` state: the handlers (joined/state/error) reset it to false via
  // setState; the ref lets onclose know, without a re-render, whether a drop happens mid-search.
  useEffect(() => {
    searchingRef.current = searching;
  }, [searching]);

  const setAuthToken = useCallback((token: string | null) => {
    tokenRef.current = token;
  }, []);

  const createRoom = useCallback(
    (name: string, playerCount: number, variant: string) =>
      ensureSocket(() => send({ type: "createRoom", name, playerCount, variant, token: tokenRef.current })),
    [ensureSocket, send],
  );

  const join = useCallback(
    (name: string, code: string) =>
      ensureSocket(() => send({ type: "join", name, roomId: code.toUpperCase(), token: tokenRef.current })),
    [ensureSocket, send],
  );

  const quickMatch = useCallback(
    (name: string, size: number, ranked = false) => {
      lastEnqueueRef.current = { name, size, ranked };
      requeuedRef.current = false;
      searchingRef.current = true;
      setSearching(true);
      ensureSocket(() => send({ type: "enqueueMatchmaking", name, size, ranked, token: tokenRef.current }));
    },
    [ensureSocket, send],
  );

  const cancelMatch = useCallback(() => {
    lastEnqueueRef.current = null;
    searchingRef.current = false;
    send({ type: "cancelMatchmaking" });
    setSearching(false);
  }, [send]);

  const resume = useCallback(
    (resumeToken: string | null) => {
      resumeTokenRef.current = resumeToken;
      ensureSocket(() => send({ type: "resume", resumeToken, token: tokenRef.current }));
    },
    [ensureSocket, send],
  );

  const addBot = useCallback(() => send({ type: "addBot" }), [send]);
  const renameBot = useCallback((seat: number, name: string) => send({ type: "renameBot", seat, name }), [send]);
  const leave = useCallback(() => {
    send({ type: "leave" });
    setState(null);
    setSeat(null);
    setRoomId(null);
    setError(null);
    setMessages([]);
  }, [send]);
  const start = useCallback(() => send({ type: "start" }), [send]);
  const play = useCallback((move: MoveT) => send({ type: "play", move }), [send]);
  const castStopVote = useCallback((stop: boolean) => send({ type: "castStopVote", stop }), [send]);
  const castPauseVote = useCallback((pause: boolean) => send({ type: "castPauseVote", pause }), [send]);
  const resumeGame = useCallback(() => send({ type: "resumeGame" }), [send]);
  const sendChat = useCallback((text: string) => send({ type: "chat", text }), [send]);

  return { state, seat, roomId, error, status, messages, rankedResults, resumeUnavailable, searching, setAuthToken, createRoom, join, quickMatch, cancelMatch, resume, addBot, renameBot, leave, start, play, castStopVote, castPauseVote, resumeGame, sendChat };
}
