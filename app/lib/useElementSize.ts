"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

export type Size = { width: number; height: number };

/** Tracks an element's content box; returns a callback ref plus its latest size (0×0 before mount). */
export function useElementSize<T extends HTMLElement>(): [(el: T | null) => void, Size] {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const ref = useCallback((el: T | null) => {
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize((prev) =>
        Math.round(prev.width) === Math.round(r.width) && Math.round(prev.height) === Math.round(r.height)
          ? prev
          : { width: r.width, height: r.height },
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
