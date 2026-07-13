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
  // URL de connexion courante (peut être réécrite vers un pod propriétaire sur redirect) et
  // dernier resume token, rejoué à l'identique après un redirect.
  const urlRef = useRef<string>(WS_URL);
  const resumeTokenRef = useRef<string | null>(null);
  // Indirection stable pour rouvrir le socket depuis un handler (redirect) sans dépendance circulaire.
  const connectRef = useRef<(onReady: () => void) => void>(() => {});
  // Fermeture volontaire (redirect/matched) : distingue un handoff piloté par un handler d'une
  // coupure subie, pour ne pas re-enfiler par erreur pendant un match.
  const intentionalCloseRef = useRef(false);
  // Dernière demande de matchmaking + garde-fous : re-enfiler UNE fois si le socket tombe en pleine
  // recherche (pod home mort → « re-queue transparent » sur un survivant).
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
  // En file de matchmaking : le serveur n'acquitte pas, on garde l'état localement jusqu'à ce
  // qu'une partie arrive (message "state"), qu'une erreur tombe, ou que le joueur annule.
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
        return; // handoff piloté par le handler redirect/matched : il rouvre le socket lui-même
      }
      setStatus("closed");
      if (searchingRef.current && lastEnqueueRef.current && !requeuedRef.current) {
        // Coupure subie pendant la recherche (pod home mort) : une seule tentative de ré-inscription
        // sur un pod survivant, puis on abandonne si ça retombe (pas de boucle si le serveur est down).
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
      } else if (msg.type === "error") {
        setError(msg.message);
        setSearching(false);
      } else if (msg.type === "state") {
        setState(msg as GameState);
        setSearching(false);
      } else if (msg.type === "chat") {
        setMessages((prev) => [...prev, msg as ChatBroadcast]);
      } else if (msg.type === "rankedResult") {
        setRankedResults(msg.entries as RankedMessagesRankedResultEntry[]);
      } else if (msg.type === "resumeUnavailable") {
        setResumeUnavailable(true);
      } else if (msg.type === "redirect") {
        // La partie vit sur un autre pod : on rebranche le socket dessus et on rejoue le resume.
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
        // Matchmaking a formé une table sur le pod msg.pod : le serveur nous fournit le resume token du
        // siège réservé (on n'en avait pas). On se branche sur ce pod et on réclame le siège, exactement
        // comme un redirect de reconnexion.
        resumeTokenRef.current = msg.resumeToken;
        urlRef.current = buildPodWsUrl(WS_URL, msg.pod);
        intentionalCloseRef.current = true;
        try {
          ws.close();
        } catch {
          // socket already closing; the fresh connect below is what matters
        }
        connectRef.current(() => send({ type: "resume", resumeToken: msg.resumeToken, token: tokenRef.current }));
      }
    };
  }, [send]);

  useEffect(() => {
    connectRef.current = ensureSocket;
  }, [ensureSocket]);

  // Miroir de l'état `searching` : les handlers (joined/state/error) le remettent à false via setState ;
  // le ref permet à onclose de savoir, sans re-render, si une coupure survient en pleine recherche.
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
