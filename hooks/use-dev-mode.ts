"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "nox-dev-mode";

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  function handleStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY) callback();
  }
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function useDevMode() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    // Trigger re-render for same-tab consumers
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: String(value) }));
  }, []);

  return { enabled, toggle };
}
