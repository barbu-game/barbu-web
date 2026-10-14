"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { ChatBroadcast } from "@barbu-game/barbu-api";
import { useT } from "../lib/i18n";
import { cn } from "../lib/cn";

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
  className,
}: {
  messages: ChatBroadcast[];
  onSend: (text: string) => void;
  disabled: boolean;
  className?: string;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // Scroll the list itself: scrollIntoView would also scroll every ancestor, nudging the whole page.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div ref={listRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-4 py-3 text-sm">
        {messages.length === 0 && <p className="pt-6 text-center text-xs text-muted-fg">{t("chat.empty")}</p>}
        {messages.map((m, i) =>
          m.system ? (
            <p key={i} className="text-xs text-muted-fg">
              {m.text}
            </p>
          ) : (
            <p key={i} className="break-words leading-snug">
              <span className={cn("font-medium", SEAT_COLORS[m.seat % SEAT_COLORS.length])}>{m.name}</span>
              <span className="text-muted-fg"> · </span>
              <span>{m.text}</span>
            </p>
          ),
        )}
      </div>
      <form onSubmit={submit} className="flex shrink-0 gap-2 border-t border-border p-2">
        <input
          data-testid="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={280}
          disabled={disabled}
          placeholder={disabled ? t("chat.joinToChat") : t("chat.message")}
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-base text-foreground outline-none focus:border-gold-soft/60 disabled:opacity-40 sm:text-sm"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          aria-label={t("chat.send")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold-soft text-[#231a08] transition-opacity disabled:opacity-30"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
