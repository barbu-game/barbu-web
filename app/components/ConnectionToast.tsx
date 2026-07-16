"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../lib/i18n";
import type { ConnectionPhase } from "../lib/connectionPhase";

const STYLES: Record<"reconnecting" | "reconnected" | "failed", string> = {
  reconnecting: "bg-amber-500/95 text-amber-950",
  reconnected: "bg-emerald-500/95 text-emerald-950",
  failed: "bg-red-600/95 text-red-50",
};

// `phase` is the stable phase (connected/reconnecting/failed); the transient reconnected success
// is local state on the reconnecting→connected edge, else the recovery would be invisible.
export default function ConnectionToast({ phase }: { phase: ConnectionPhase }) {
  const t = useT();
  const [justReconnected, setJustReconnected] = useState(false);
  const prevPhase = useRef<ConnectionPhase>(phase);

  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = phase;
    if (was === "reconnecting" && phase === "connected") {
      setJustReconnected(true);
      const id = setTimeout(() => setJustReconnected(false), 2000);
      return () => clearTimeout(id);
    }
  }, [phase]);

  let variant: "reconnecting" | "reconnected" | "failed" | null = null;
  let label = "";
  if (phase === "failed") {
    variant = "failed";
    label = t("conn.failed");
  } else if (phase === "reconnecting") {
    variant = "reconnecting";
    label = t("conn.reconnecting");
  } else if (justReconnected) {
    variant = "reconnected";
    label = t("conn.reconnected");
  }

  return (
    <AnimatePresence>
      {variant && (
        <motion.div
          key={variant}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg ${STYLES[variant]}`}
        >
          {variant === "reconnecting" && (
            <motion.span
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
              className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
            />
          )}
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
