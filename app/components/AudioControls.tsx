"use client";

import { useState } from "react";
import { audio } from "../lib/audio";

export default function AudioControls() {
  const [on, setOn] = useState(true);

  const toggle = () => {
    const next = !on;
    setOn(next);
    audio.setSfx(next);
  };

  return (
    <button
      onClick={toggle}
      title={on ? "Card sounds on" : "Card sounds off"}
      className="fixed right-4 top-4 z-50 flex items-center gap-1.5 rounded-full bg-slate-900/70 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-800"
    >
      <span>{on ? "🔊" : "🔇"}</span>
      <span className="text-xs">Cards</span>
    </button>
  );
}
