"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatBroadcast } from "@barbu-game/barbu-api";

const SEAT_COLORS = [
  "text-emerald-300",
  "text-sky-300",
  "text-amber-300",
  "text-rose-300",
  "text-violet-300",
  "text-lime-300",
  "text-cyan-300",
  "text-orange-300",
  "text-pink-300",
  "text-teal-300",
];

export default function ChatPanel({
  messages,
  onSend,
  disabled,
}: {
  messages: ChatBroadcast[];
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="flex h-64 w-full flex-col rounded-xl bg-slate-900/70 ring-1 ring-white/10">
      <div className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
        {messages.map((m, i) => (
          <p key={i}>
            <span className={`font-semibold ${SEAT_COLORS[m.seat % SEAT_COLORS.length]}`}>{m.name}</span>
            <span className="text-slate-500">: </span>
            <span className="text-slate-200">{m.text}</span>
          </p>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t border-white/10 p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          maxLength={280}
          disabled={disabled}
          placeholder={disabled ? "Join a table to chat" : "Message…"}
          className="flex-1 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
