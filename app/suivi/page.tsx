"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { withBasePath } from '@/lib/base-path';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IS_DEMO } from '@/lib/demo';

interface OrderTrack {
  id: string; // ID formaté (CMD-001...)
  customerName: string;
  phone: string;
  status: 'en_preparation' | 'prete';
  items: { name: string; quantity: number; [key: string]: any }[];
}

// 1. Fonction de formatage propre des noms (identique à l'admin)
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

// 2. Fonction de formatage des valeurs (Oui/Non, objets, tableaux)
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
    setOrder(null);

    // En démo, aucune vraie commande n'est passée : on n'interroge pas Supabase
    if (IS_DEMO) return;

    setLoading(true);

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

  // 3. Extraction propre des options dynamiques avec filtrage technique
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

  return (
    <main className="min-h-screen bg-[#40342C] text-[#FAF6F0] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      <div>
        {/* Header */}
        <header className="bg-[#372D26]/90 backdrop-blur-md border-b border-[#59493E] p-4 sticky top-0 z-40 flex justify-between items-center px-6 shadow-md">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 transform group-hover:scale-110 transition duration-300">
              <Image src={withBasePath('/logo.png')} alt="Logo" fill className="object-cover" />
            </div>
            <span className="font-black text-lg tracking-tighter text-white">
              CHICKEN <span className="text-orange-400">BURGER</span>
            </span>
          </Link>
          <Link href="/" className="bg-[#4E3F35] hover:bg-[#5E4C40] text-white px-4 py-2 rounded-full font-bold text-xs border border-[#6B5749] transition shadow-md">
            ← Accueil
          </Link>
        </header>

        {/* Titre */}
        <section className="max-w-xl mx-auto px-6 pt-16 pb-8 text-center">
          <span className="inline-block bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-sm backdrop-blur-md">
            Temps réel
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 mb-4 drop-shadow-md">
            Suivi de commande
          </h1>
          <p className="text-[#F5F0E8] text-xs sm:text-sm font-medium">
            Entrez votre numéro de commande (ex: CMD-001) ou votre numéro de téléphone pour suivre l'avancement en direct.
          </p>
        </section>

        {/* Formulaire de recherche */}
        <div className="max-w-md mx-auto px-6 mb-12">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text"
              placeholder="Ex: CMD-001 ou 0612345678"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#372D26]/90 border border-[#59493E] rounded-2xl px-4 py-3 text-sm text-white placeholder-[#CBC0B4] focus:outline-none focus:border-emerald-500 transition shadow-inner"
              required
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-500/50 text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-lg shadow-orange-600/20"
            >
              {loading ? 'Recherche...' : 'Suivre'}
            </button>
          </form>
        </div>

        {/* Résultat du suivi */}
        {searched && (
          <div className="max-w-md mx-auto px-6">
            {order ? (
              <div className="bg-[#372D26]/90 backdrop-blur-sm border border-[#59493E] rounded-3xl p-6 shadow-xl space-y-6 text-center">
                <div>
                  <span className="text-xs text-[#CBC0B4] uppercase tracking-widest font-medium">Commande</span>
                  <h3 className="text-2xl font-black text-emerald-400">{order.id}</h3>
                  <p className="text-sm text-white font-semibold">Client : {order.customerName}</p>
                </div>

                {/* Indicateur de statut visuel */}
                <div className="py-4 border-y border-[#59493E] flex flex-col items-center justify-center space-y-3">
                  {order.status === 'en_preparation' ? (
                    <div className="bg-amber-500/10 border border-amber-500/35 text-amber-300 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 animate-pulse">
                      <span>⏳</span> Votre commande est en cours de préparation en cuisine...
                    </div>
                  ) : (
                    <div className="bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
                      <span>🎉</span> Votre commande est prête ! Vous pouvez venir la récupérer.
                    </div>
                  )}
                </div>

                {/* Détails */}
                <div className="text-left space-y-2">
                  <h4 className="text-xs font-bold text-[#CBC0B4] uppercase tracking-wider">Récapitulatif :</h4>
                  <ul className="space-y-3 text-sm text-[#F5F0E8] bg-[#4E3F35]/50 p-4 rounded-xl border border-[#59493E]">
                    {order.items.map((item, idx) => {
                      const details = getDynamicItemDetails(item);
                      return (
                        <li key={idx} className="flex flex-col gap-1 border-b border-[#59493E] pb-2 last:border-0 last:pb-0">
                          <div className="flex justify-between font-medium">
                            <span>{item.quantity}x {item.name}</span>
                          </div>
                          {details && details.map((d, dIdx) => (
                            <p key={dIdx} className="text-xs text-[#CBC0B4] pl-4">
                              ↳ <span className="font-semibold text-white">{d.key} :</span> {d.val}
                            </p>
                          ))}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : IS_DEMO ? (
              <div className="bg-sky-400/10 border border-sky-400/40 rounded-3xl p-6 text-center text-sky-200 text-sm shadow-xl">
                <strong className="text-sky-300">Mode démo :</strong> le suivi de commande est désactivé sur ce site de démonstration, car aucune commande n&apos;y est réellement passée.
              </div>
            ) : (
              <div className="bg-[#372D26]/90 border border-[#59493E] rounded-3xl p-6 text-center text-[#CBC0B4] text-sm shadow-xl">
                ❌ Aucune commande trouvée pour <strong className="text-white">"{searchQuery}"</strong>. Vérifiez vos informations.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer simple */}
      <footer className="bg-[#332922] border-t border-[#59493E] py-6 text-center text-xs text-[#B8ABA0] mt-16 relative z-20">
        <p>© 2026 Chicken Burger Lure — 34 Rue de la Gare</p>
      </footer>
    </main>
  );
}

export default function SuiviCommandePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#40342C] text-[#FAF6F0] flex items-center justify-center font-bold text-emerald-400">Chargement...</div>}>
      <SuiviContent />
    </Suspense>
  );
}