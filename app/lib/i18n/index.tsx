"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fr } from "./fr";
import { en } from "./en";

export type Locale = "fr" | "en";
export type TranslationKey = keyof typeof fr;

const DICTS: Record<Locale, Record<TranslationKey, string>> = { fr, en };
const STORAGE_KEY = "barbu.locale";

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

// Locale lives in a tiny external store rather than React state so it can be read via
// useSyncExternalStore — that reads the browser value after hydration without an SSR mismatch.
let cached: Locale | null = null;
const listeners = new Set<() => void>();

function readLocale(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "fr" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Locale {
  if (cached === null) cached = readLocale();
  return cached;
}

function getServerSnapshot(): Locale {
  return "fr";
}

function setLocale(l: Locale): void {
  window.localStorage.setItem(STORAGE_KEY, l);
  cached = l;
  listeners.forEach((cb) => cb());
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { locale, setLocale };
}

export function useT() {
  const { locale } = useLocale();
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    interpolate(DICTS[locale][key], vars);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <>{children}</>;
}
