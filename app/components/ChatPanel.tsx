"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { ChatBroadcast } from "@barbu-game/barbu-api";
import { useT } from "../lib/i18n";
import Panel from "../ui/Panel";
import Button from "../ui/Button";

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
  const t = useT();
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
    <Panel className="flex h-64 w-full flex-col">
      <div className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
        {messages.map((m, i) =>
          m.system ? (
            <p key={i} className="italic text-muted-fg">
              — {m.text}
            </p>
          ) : (
            <p key={i}>
              <span className={`font-semibold ${SEAT_COLORS[m.seat % SEAT_COLORS.length]}`}>{m.name}</span>
              <span className="text-muted-fg">: </span>
              <span className="text-foreground">{m.text}</span>
            </p>
          ),
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t border-border p-2">
        <input
          data-testid="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          maxLength={280}
          disabled={disabled}
          placeholder={disabled ? t("chat.joinToChat") : t("chat.message")}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-gold-soft disabled:opacity-40"
        />
        <Button variant="gold" size="sm" onClick={submit} disabled={disabled} aria-label={t("chat.send")}>
          <Send size={16} />
        </Button>
      </div>
    </Panel>
  );
}
