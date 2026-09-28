"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IS_DEMO, findDemoOrder } from '@/lib/demo';
import SiteHeader from '@/app/_components/SiteHeader';
import SiteFooter from '@/app/_components/SiteFooter';
import { PageIntro } from '@/app/_components/ui';
import { IconCheck, IconClock, IconSearch, IconX } from '@/app/_components/icons';

interface OrderTrack {
  id: string;
  customerName: string;
  phone: string;
  status: 'en_preparation' | 'prete';
  items: { name: string; quantity: number; [key: string]: any }[];
}

function formatTabName(rawKey: string): string {
  const key = rawKey.toLowerCase().trim();

  const customMap: Record<string, string> = {
    'selectedsauce': 'Sauce principale',
    'sauce': 'Sauce principale',
    'selectedviandes': 'Viande',
    'viande': 'Viande',
    'boisson': 'Boisson',
    'crudites_a_retirer__supplement_': 'Crudité(s)',
    'crudites': 'Crudité(s)'
  };

  if (customMap[key]) {
    return customMap[key];
  }

  let formatted = rawKey
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();

  if (formatted.startsWith('supplement')) {
    formatted = formatted.replace('supplement', 'Supplément(s)');
  }

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatOptionValue(value: any): string {
  if (value === null || value === undefined || value === '' || value === false) return '';

  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }

  if (value === 'true' || value === 'false') {
    return value === 'true' ? 'Oui' : 'Non';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    return value.join(', ');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([_, subV]) => subV !== undefined && subV !== null && subV !== '' && subV !== false && subV !== 0);
    if (entries.length === 0) return '';
    return entries
      .map(([subK, subV]) => (Number(subV) > 1 ? `${subV}x ${subK}` : subK))
      .join(', ');
  }

  return String(value);
}

function SuiviContent() {
  const searchParams = useSearchParams();
  const orderQuery = searchParams.get('order') || '';

  const [searchQuery, setSearchQuery] = useState(orderQuery);
  const [order, setOrder] = useState<OrderTrack | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const performSearch = async (queryToSearch: string) => {
    const cleanQuery = queryToSearch.trim();
    if (!cleanQuery) return;

    setSearched(true);
    setLoading(true);
    setOrder(null);

    if (IS_DEMO) {
      // Démo : on cherche parmi les commandes simulées gardées dans le navigateur.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setOrder(findDemoOrder(cleanQuery));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const allFormattedOrders = data.map((item: any, index: number) => {
        let parsedItems = [];
        try {
          parsedItems = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []);
        } catch (err) {
          parsedItems = [];
        }

        return {
          id: `CMD-${String(index + 1).padStart(3, '0')}`,
          customerName: item.customer_name || 'Client',
          phone: item.phone ? String(item.phone).trim() : '',
          status: item.status || 'en_preparation',
          items: parsedItems
        };
      });

      const found = allFormattedOrders.find(o =>
        o.id.toLowerCase() === cleanQuery.toLowerCase() ||
        o.phone === cleanQuery ||
        o.phone.replace(/\s+/g, '') === cleanQuery.replace(/\s+/g, '')
      );

      setOrder(found || null);
    } catch (err) {
      console.error("Erreur lors de la recherche :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderQuery) {
      setSearchQuery(orderQuery);
      performSearch(orderQuery);
    }
  }, [orderQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const getDynamicItemDetails = (item: any) => {
  const ignoredKeys = [
    'name', 'quantity', 'price', 'finalprice', 'id', 'image', 'category', 'total',
    'baseprice', 'cartitemid', 'categoryid', 'category_id'
  ];
  const results: { key: string; val: string }[] = [];

  Object.entries(item).forEach(([key, value]) => {
    const cleanLowerKey = key.toLowerCase().replace(/[_ ]/g, '');
    if (ignoredKeys.includes(cleanLowerKey)) return;

    if (key === 'dynamicSelections' && typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([tabName, selectedOptValue]) => {
        const formattedVal = formatOptionValue(selectedOptValue);
        if (formattedVal && formattedVal !== 'Non' && formattedVal !== '') {
          results.push({
            key: formatTabName(tabName),
            val: formattedVal
          });
        }
      });
    } else {
      const formattedVal = formatOptionValue(value);
      if (formattedVal && formattedVal !== 'Non' && formattedVal !== '') {
        let cleanKey = key;
        if (key.toLowerCase() === 'ismenu' || key.toLowerCase() === 'ismenu?') cleanKey = 'En menu';

        results.push({
          key: formatTabName(cleanKey),
          val: formattedVal
        });
      }
    }
  });

  return results.length > 0 ? results : null;
};

  const isReady = order?.status === 'prete';
  const steps = [
    { label: 'Reçue', state: 'done' },
    { label: 'En préparation', state: isReady ? 'done' : 'active' },
    { label: 'Prête', state: isReady ? 'done' : 'todo' },
  ] as const;

  return (
    <>
      <SiteHeader />

      <main id="contenu" className="flex-1 pb-24">
        <PageIntro eyebrow="Temps réel" title="Suivi de commande" accent="bg-cheddar">
          Entrez votre numéro de commande (ex: CMD-001) ou votre numéro de téléphone pour suivre l&apos;avancement en direct.
        </PageIntro>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <form onSubmit={handleSearch} className="flex max-w-xl flex-col gap-2 sm:flex-row">
            <label htmlFor="suivi-query" className="sr-only">Numéro de commande ou téléphone</label>
            <div className="group relative flex-1">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-grill-soft transition duration-300 ease-spring group-focus-within:scale-110 group-focus-within:text-grill" />
              <input
                id="suivi-query"
                type="text"
                placeholder="Ex: CMD-001 ou 0612345678"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 w-full rounded-lg border-2 border-transparent bg-crumb pl-12 pr-4 text-base text-grill placeholder:text-grill-soft/70 transition-colors focus:border-grill focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-cheddar h-14 px-8 text-sm uppercase tracking-[0.08em] disabled:cursor-wait"
            >
              {loading && <span className="size-4 animate-spin rounded-full border-2 border-espresso/30 border-t-espresso" aria-hidden="true" />}
              {loading ? 'Recherche...' : 'Suivre'}
            </button>
          </form>

          {IS_DEMO && (
            <p className="mt-4 max-w-xl rounded-lg bg-cheddar-light px-4 py-3 text-sm leading-relaxed text-grill">
              <strong>Mode démo :</strong> passez une commande simulée depuis la page Commander, puis suivez-la ici avec son numéro. Elle passe « prête » au bout d&apos;une minute.
            </p>
          )}

          {searched && (
            <div className="mt-10 max-w-xl" aria-live="polite">
              {loading ? (
                <div className="h-64 animate-pulse rounded-2xl bg-sesame/70" aria-hidden="true" />
              ) : order ? (
                <article className="animate-rise overflow-hidden rounded-2xl bg-crumb">
                  <div className="flex flex-wrap items-end justify-between gap-4 p-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-grill-soft">Commande</p>
                      <h2 className="mt-1 font-display text-5xl uppercase leading-none tabular-nums">{order.id}</h2>
                    </div>
                    <p className="text-sm font-semibold text-grill-soft">Client : <span className="text-grill">{order.customerName}</span></p>
                  </div>

                  <div className={`flex items-center gap-4 px-6 py-5 ${isReady ? 'bg-pickle text-white' : 'bg-cheddar text-espresso'}`}>
                    <span className={`grid size-11 shrink-0 animate-pop place-items-center rounded-full [animation-delay:200ms] ${isReady ? 'bg-white text-pickle' : 'bg-espresso text-cheddar'}`}>
                      {isReady ? <IconCheck className="draw-check size-6" strokeWidth={3} /> : <IconClock className="size-6 animate-[spin_6s_linear_infinite]" />}
                    </span>
                    <p className="animate-rise font-bold leading-snug [animation-delay:260ms]">
                      {isReady
                        ? "Votre commande est prête ! Vous pouvez venir la récupérer."
                        : "Votre commande est en cours de préparation en cuisine..."}
                    </p>
                  </div>

                  <ol className="grid grid-cols-3 gap-2 px-6 pt-6" aria-label="Avancement de la commande">
                    {steps.map((step, index) => (
                      <li key={step.label} aria-current={step.state === 'active' ? 'step' : undefined}>
                        <span className="block h-2 overflow-hidden rounded-full bg-sesame">
                          {step.state !== 'todo' && (
                            <span
                              className="block h-full origin-left animate-grow-x"
                              style={{ animationDelay: `${350 + index * 220}ms` }}
                            >
                              <span className={`block h-full rounded-full ${step.state === 'done' ? 'bg-pickle' : 'animate-pulse bg-cheddar'}`} />
                            </span>
                          )}
                        </span>
                        <span className={`mt-2 block text-xs font-bold ${step.state === 'todo' ? 'text-grill-soft' : 'text-grill'}`}>
                          {step.label}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <div className="p-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-grill-soft">Récapitulatif</h3>
                    <ul className="mt-3 rounded-xl bg-bun px-4">
                      {order.items.map((item, idx) => {
                        const details = getDynamicItemDetails(item);
                        return (
                          <li
                            key={idx}
                            className="animate-rise border-b-2 border-dashed border-sesame-dark py-3 last:border-0"
                            style={{ animationDelay: `${450 + Math.min(idx, 6) * 70}ms` }}
                          >
                            <p className="flex items-baseline gap-2 font-semibold">
                              <span className="font-display text-lg tabular-nums">{item.quantity}x</span>
                              {item.name}
                            </p>
                            {details && details.map((d, dIdx) => (
                              <p key={dIdx} className="mt-0.5 pl-7 text-xs text-grill-soft">
                                <span className="font-semibold text-grill">{d.key} :</span> {d.val}
                              </p>
                            ))}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </article>
              ) : (
                <div className="flex animate-rise items-start gap-4 rounded-2xl bg-crumb p-6">
                  <span className="grid size-10 shrink-0 animate-wiggle place-items-center rounded-full bg-ketchup-light text-ketchup-ink [animation-delay:200ms]">
                    <IconX className="size-5" />
                  </span>
                  <p className="text-sm leading-relaxed text-grill-soft">
                    Aucune commande trouvée pour <strong className="text-grill">&quot;{searchQuery}&quot;</strong>. Vérifiez vos informations.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

export default function SuiviCommandePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh flex-1 items-center justify-center">
          <p className="flex items-center gap-3 text-sm font-semibold text-grill-soft">
            <span className="size-2.5 animate-pulse rounded-sm bg-pickle" aria-hidden="true" />
            Chargement...
          </p>
        </main>
      }
    >
      <SuiviContent />
    </Suspense>
  );
}
