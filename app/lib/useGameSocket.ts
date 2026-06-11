"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatBroadcast } from "@barbu-game/barbu-api";
import type { GameState, MoveT } from "./game";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws/game";

type Status = "idle" | "connecting" | "open" | "closed";

export function useGameSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<ChatBroadcast[]>([]);

  const ensureSocket = useCallback((onReady: () => void) => {
    const existing = wsRef.current;
    if (existing && existing.readyState === WebSocket.OPEN) {
      onReady();
      return;
    }
    setStatus("connecting");
    setError(null);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      setStatus("open");
      onReady();
    };
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setError("Connection error — is the server running?");
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "joined") {
        setSeat(msg.seat);
        setRoomId(msg.roomId);
      } else if (msg.type === "error") {
        setError(msg.message);
      } else if (msg.type === "state") {
        setState(msg as GameState);
      } else if (msg.type === "chat") {
        setMessages((prev) => [...prev, msg as ChatBroadcast]);
      }
    };
  }, []);

  const send = useCallback((payload: unknown) => {
    wsRef.current?.send(JSON.stringify(payload));
  }, []);

  const setAuthToken = useCallback((token: string | null) => {
    tokenRef.current = token;
  }, []);

  const createRoom = useCallback(
    (name: string, playerCount: number) =>
      ensureSocket(() => send({ type: "createRoom", name, playerCount, token: tokenRef.current })),
    [ensureSocket, send],
  );

  const join = useCallback(
    (name: string, code: string) =>
      ensureSocket(() => send({ type: "join", name, roomId: code.toUpperCase(), token: tokenRef.current })),
    [ensureSocket, send],
  );

  const quickMatch = useCallback(
    (name: string, size: number) =>
      ensureSocket(() => send({ type: "enqueueMatchmaking", name, size, token: tokenRef.current })),
    [ensureSocket, send],
  );

  const addBot = useCallback(() => send({ type: "addBot" }), [send]);
  const start = useCallback(() => send({ type: "start" }), [send]);
  const play = useCallback((move: MoveT) => send({ type: "play", move }), [send]);
  const castStopVote = useCallback((stop: boolean) => send({ type: "castStopVote", stop }), [send]);
  const sendChat = useCallback((text: string) => send({ type: "chat", text }), [send]);

  return { state, seat, roomId, error, status, messages, setAuthToken, createRoom, join, quickMatch, addBot, start, play, castStopVote, sendChat };
}
