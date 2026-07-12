"use client";

// Mémorise le dernier pseudo invité saisi, pour le repré-remplir au prochain passage. Les comptes
// ont déjà leur username (lib/auth.ts) — on ne stocke ici que le nom d'invité.

const GUEST_NAME_KEY = "barbu.guestName";

export function saveGuestName(name: string) {
  try {
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem(GUEST_NAME_KEY, trimmed);
  } catch {
    // localStorage indisponible (mode privé) — on ne mémorise pas, sans incidence
  }
}

export function loadGuestName(): string {
  try {
    return localStorage.getItem(GUEST_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}
