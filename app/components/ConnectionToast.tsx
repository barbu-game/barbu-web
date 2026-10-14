"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../lib/i18n";
import type { ConnectionPhase } from "../lib/connectionPhase";

const DOT: Record<"reconnecting" | "reconnected" | "failed", string> = {
  reconnecting: "bg-gold-soft animate-pulse",
  reconnected: "bg-success",
  failed: "bg-danger",
};

// Connection status toast, top-centre so it never covers the hand. `phase` is the stable phase;
// the brief "Reconnected ✓" is local state, raised on the reconnecting → connected edge,
// otherwise the recovery would be invisible.
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
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-16 z-[70] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface-2 px-4 py-2 text-sm shadow-xl"
        >
          <span className={`h-2 w-2 rounded-full ${DOT[variant]}`} />
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
