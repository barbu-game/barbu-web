"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { useT } from "../lib/i18n";

export default function FullscreenToggle() {
  const t = useT();
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

  const label = full ? t("controls.exitFullscreen") : t("controls.fullscreen");
  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      className="flex items-center rounded-full border border-border bg-surface px-3 py-2 text-muted-fg transition hover:text-foreground"
    >
      {full ? <Minimize size={18} /> : <Maximize size={18} />}
    </button>
  );
}
