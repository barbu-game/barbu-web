"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Maximize, Minimize, Settings2, Volume2, VolumeX } from "lucide-react";
import { audio } from "../lib/audio";
import { useT } from "../lib/i18n";
import IconButton from "../ui/IconButton";
import LocaleSwitcher from "../ui/LocaleSwitcher";

function subscribeFullscreen(cb: () => void) {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-11 items-center justify-between gap-4 px-3">
      <span className="text-sm text-muted-fg">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsMenu() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(() => audio.isSfxOn());
  const root = useRef<HTMLDivElement>(null);
  const fullscreen = useSyncExternalStore(subscribeFullscreen, () => Boolean(document.fullscreenElement), () => false);
  // iPhone Safari has no Fullscreen API: hide the row rather than offer a dead toggle.
  const canFullscreen = useSyncExternalStore(subscribeFullscreen, () => Boolean(document.fullscreenEnabled), () => false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleSound = () => {
    audio.setSfx(!sound);
    setSound(!sound);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <div ref={root} className="relative">
      <IconButton label={t("controls.settings")} active={open} onClick={() => setOpen((o) => !o)}>
        <Settings2 size={18} />
      </IconButton>
      {open && (
        <div className="animate-fade-in absolute right-0 top-11 z-50 w-60 rounded-xl border border-border bg-surface-2 py-1 shadow-2xl">
          <Row label={t("controls.language")}>
            <LocaleSwitcher />
          </Row>
          <Row label={t("controls.sound")}>
            <IconButton label={sound ? t("controls.soundsOn") : t("controls.soundsOff")} onClick={toggleSound}>
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </IconButton>
          </Row>
          {canFullscreen && (
            <Row label={t("controls.fullscreen")}>
              <IconButton
                label={fullscreen ? t("controls.exitFullscreen") : t("controls.fullscreen")}
                onClick={toggleFullscreen}
              >
                {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </IconButton>
            </Row>
          )}
        </div>
      )}
    </div>
  );
}
