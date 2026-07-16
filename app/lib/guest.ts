"use client";

// Remembers the last guest name typed, to pre-fill it next time. Accounts already carry their
// username; here we only store the guest name.

const GUEST_NAME_KEY = "barbu.guestName";

export function saveGuestName(name: string) {
  try {
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem(GUEST_NAME_KEY, trimmed);
  } catch {
    // localStorage unavailable (private mode) — we don't remember, no impact
  }
}

export function loadGuestName(): string {
  try {
    return localStorage.getItem(GUEST_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}
