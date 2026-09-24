import { useSyncExternalStore } from 'react';

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const STORAGE_KEY = 'demo_restaurant_ouvert';
const listeners = new Set<() => void>();
let ouvert: boolean | null = null;

function lireOuvert() {
  if (ouvert === null) {
    try {
      ouvert = localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
      ouvert = true;
    }
  }
  return ouvert;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDemoOuvert(valeur: boolean) {
  ouvert = valeur;
  try {
    localStorage.setItem(STORAGE_KEY, String(valeur));
  } catch {}
  listeners.forEach((listener) => listener());
}

export function useDemoOuvert() {
  return useSyncExternalStore(subscribe, lireOuvert, () => true);
}
