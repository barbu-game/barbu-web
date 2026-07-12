"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { audio } from "../lib/audio";
import { useT } from "../lib/i18n";

export default function AudioControls() {
  const t = useT();
  const [on, setOn] = useState(true);

  const toggle = () => {
    const next = !on;
    setOn(next);
    audio.setSfx(next);
  };

  const label = on ? t("controls.soundsOn") : t("controls.soundsOff");
  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      className="flex items-center rounded-full border border-border bg-surface px-3 py-2 text-muted-fg transition hover:text-foreground"
    >
      {on ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
