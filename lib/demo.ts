import { useSyncExternalStore } from 'react';

export { IS_DEMO } from './demo-mode';

// État du restaurant choisi par le visiteur (bannière de démo), mémorisé dans son navigateur.
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

// Commandes simulées : gardées uniquement dans le navigateur du visiteur, jamais envoyées au restaurant.
const ORDERS_KEY = 'demo_commandes';
export const DEMO_READY_AFTER_MS = 60_000;

export interface DemoOrder {
  id: string;
  customerName: string;
  phone: string;
  note: string | null;
  items: { name: string; quantity: number }[];
  createdAt: number;
}

function lireCommandes(): DemoOrder[] {
  try {
    const saved = localStorage.getItem(ORDERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveDemoOrder(order: Omit<DemoOrder, 'id' | 'createdAt'>): string {
  const commandes = lireCommandes();
  const id = `CMD-${String(commandes.length + 1).padStart(3, '0')}`;
  commandes.push({ ...order, id, createdAt: Date.now() });
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(commandes));
  } catch {}
  return id;
}

// En démo, une commande passe « prête » automatiquement au bout d'une minute.
export function findDemoOrder(query: string) {
  const clean = query.trim().toLowerCase().replace(/\s+/g, '');
  const found = lireCommandes().find(
    (o) => o.id.toLowerCase() === clean || o.phone.replace(/\s+/g, '') === clean
  );
  if (!found) return null;
  return {
    id: found.id,
    customerName: found.customerName,
    phone: found.phone,
    status: (Date.now() - found.createdAt >= DEMO_READY_AFTER_MS ? 'prete' : 'en_preparation') as 'prete' | 'en_preparation',
    items: found.items,
  };
}
