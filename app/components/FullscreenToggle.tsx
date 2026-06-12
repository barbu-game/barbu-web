"use client";

import { useEffect, useState } from "react";

export default function FullscreenToggle() {
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      // Optional chaining: iPhone Safari has no Fullscreen API, so this is a safe no-op there.
      document.documentElement.requestFullscreen?.();
    }
  };

  return (
    <button
      onClick={toggle}
      title={full ? "Exit fullscreen" : "Fullscreen"}
      aria-label={full ? "Exit fullscreen" : "Fullscreen"}
      className="flex items-center gap-1.5 rounded-full bg-slate-900/70 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-800"
    >
      <span>{full ? "🡾" : "⛶"}</span>
    </button>
  );
}
