"use client";
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { loginAction, checkAuthAction } from '@/app/actions/auth';

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
  finalPrice?: number;
  [key: string]: any;
}

interface Order {
  id: string;          
  originalId: string;  
  customerName: string;
  phone: string;
  note?: string;       
  isPaidOnline: boolean;
  status: 'en_preparation' | 'prete';
  items: OrderItem[];
  createdAt: string;
  isNew: boolean;      
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

export default function AdminCommandesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [forceClosed, setForceClosed] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  const prevOrdersCountRef = useRef<number | null>(null);

  useEffect(() => {
    checkAuthAction().then((res: { authenticated: boolean }) => {
      if (res.authenticated) {
        setIsAuthenticated(true);
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginAction(passwordInput);
    if (res.success) {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('settings').select('force_closed, force_open').single();
    if (!error && data) {
      setForceClosed(data.force_closed ?? false);
      setForceOpen(data.force_open ?? false);
    }
  };

  const toggleForceClosed = async () => {
    const newState = !forceClosed;
    const { error } = await supabase
      .from('settings')
      .update({ force_closed: newState })
      .eq('force_closed', forceClosed);

    if (!error) {
      setForceClosed(newState);
      if (newState && forceOpen) {
        await supabase.from('settings').update({ force_open: false }).eq('force_open', true);
        setForceOpen(false);
      }
    }
  };

  const toggleForceOpen = async () => {
    const newState = !forceOpen;
    const { error } = await supabase
      .from('settings')
      .update({ force_open: newState })
      .eq('force_open', forceOpen);

    if (!error) {
      setForceOpen(newState);
      if (newState && forceClosed) {
        await supabase.from('settings').update({ force_closed: false }).eq('force_closed', true);
        setForceClosed(false);
      }
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/NewOrder_Sound.wav');
      audio.play().catch(e => console.log("Audio bloqué :", e));
    } catch (e) {
      console.log("Erreur audio", e);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      const currentSeen: string[] = JSON.parse(localStorage.getItem('seen_orders') || '[]');

      setOrders(prevOrders => {
        const formattedOrders: Order[] = data.map((item: any, index: number) => {
          const origId = item.id.toString();
          const hasBeenSeenBefore = currentSeen.includes(origId);
          const existingOrder = prevOrders.find(o => o.originalId === origId);

          let isNew = false;
          if (!hasBeenSeenBefore) {
            isNew = existingOrder ? existingOrder.isNew : (prevOrdersCountRef.current !== null);
          }

          return {
            id: `CMD-${String(index + 1).padStart(3, '0')}`,
            originalId: origId,
            customerName: item.customer_name || 'Client',
            phone: item.phone || '',
            note: item.note || '',
            isPaidOnline: item.is_paid_online ?? true,
            status: item.status || 'en_preparation',
            items: typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []),
            createdAt: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isNew: isNew
          };
        });

        formattedOrders.reverse();

        if (prevOrdersCountRef.current !== null && formattedOrders.length > prevOrdersCountRef.current) {
          playNotificationSound();
        }
        prevOrdersCountRef.current = formattedOrders.length;

        return formattedOrders;
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
    fetchSettings();
    const interval = setInterval(() => {
      fetchOrders();
      fetchSettings();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const markAsRead = (originalId: string) => {
    const currentSeen: string[] = JSON.parse(localStorage.getItem('seen_orders') || '[]');
    if (!currentSeen.includes(originalId)) {
      const updatedSeen = [...currentSeen, originalId];
      localStorage.setItem('seen_orders', JSON.stringify(updatedSeen));
    }
    setOrders(prev => prev.map(o => o.originalId === originalId ? { ...o, isNew: false } : o));
  };

  const toggleStatus = async (displayId: string) => {
    const currentOrder = orders.find(o => o.id === displayId);
    if (!currentOrder) return;

    markAsRead(currentOrder.originalId);
    const newStatus = currentOrder.status === 'en_preparation' ? 'prete' : 'en_preparation';

    setOrders(prev => prev.map(order => order.id === displayId ? { ...order, status: newStatus } : order));

    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', currentOrder.originalId);
  };

  const handleOpenOrder = (order: Order) => {
    markAsRead(order.originalId);
    setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
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

  const handlePrint = (order: Order) => {
    markAsRead(order.originalId);

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket ${order.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; color: #000; width: 300px; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .options { font-size: 10px; margin-left: 10px; color: #333; }
              .note-box { border: 1px dashed #000; padding: 5px; margin: 8px 0; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 16px;">CHICKEN BURGER LURE</div>
            <div class="center">34 Rue de la Gare, 70200 Lure</div>
            <div class="line"></div>
            <div><span class="bold">Commande :</span> ${order.id}</div>
            <div><span class="bold">Client :</span> ${order.customerName}</div>
            <div><span class="bold">Téléphone :</span> ${order.phone}</div>
            <div><span class="bold">Paiement :</span> ${order.isPaidOnline ? 'Payé en ligne' : 'Paiement sur place'}</div>
            ${order.note ? `<div class="note-box"><span class="bold">Note :</span> ${order.note}</div>` : ''}
            <div class="line"></div>
            <div class="bold">DÉTAIL DE LA COMMANDE :</div>
            ${order.items.map(item => {
              const details = getDynamicItemDetails(item);
              return `
                <div>- ${item.quantity}x ${item.name} (${Number(item.finalPrice ?? item.price ?? 0).toFixed(2)} €)</div>
                ${details ? details.map(d => `<div class="options">↳ ${d.key} : ${d.val}</div>`).join('') : ''}
              `;
            }).join('')}
            <div class="line"></div>
            <div class="center">Merci de votre visite !</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto overflow-hidden rounded-full border-2 border-orange-500 shadow-lg shadow-orange-500/20">
            <Image src="/logo.png" alt="Logo" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white mb-2">
              Espace Administrateur
            </h1>
            <p className="text-xs text-neutral-400">
              Veuillez entrer le mot de passe pour accéder aux commandes.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white text-center focus:outline-none focus:border-orange-500 transition pr-12"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-sm transition"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-bold">Mot de passe incorrect.</p>
            )}
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl text-sm transition shadow-lg shadow-orange-500/20"
            >
              Se connecter
            </button>
          </form>

          <Link href="/" className="block text-xs text-neutral-500 hover:text-neutral-300 transition">
            ← Retour au site public
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-orange-500">
            <Image src="/logo.png" alt="Logo" fill className="object-cover" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Admin — <span className="text-orange-500">Gestion des Commandes</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/stocks" className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold transition">
            📦 Gérer les stocks
          </Link>
          <Link href="/" className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold transition">
            ← Accueil
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={toggleForceClosed}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                forceClosed 
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30' 
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              {forceClosed ? '❌ Mode Fermeture ACTIF (Fermé)' : '❌ Activer le Mode Fermeture'}
            </button>

            <button 
              onClick={toggleForceOpen}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                forceOpen 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30' 
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              {forceOpen ? '🔥 Ouverture Forcée ACTIVE' : '🔥 Forcer l\'Ouverture'}
            </button>

            <button 
              onClick={fetchOrders}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-neutral-700"
            >
              Rafraîchir
            </button>
            <button 
              onClick={playNotificationSound}
              className="bg-neutral-800 hover:bg-neutral-700 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-neutral-700"
              title="Tester le son"
            >
              🔔 Tester le son
            </button>
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-full text-xs font-bold">
              {orders.length} active(s)
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500 text-xs">
              Aucune commande pour le moment.
            </div>
          ) : (
            orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;

              return (
                <div 
                  key={order.originalId} 
                  className={`bg-neutral-900 border rounded-2xl p-4 transition shadow-lg ${
                    order.isNew ? 'border-orange-500 animate-pulse bg-orange-950/10' : 'border-neutral-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleOpenOrder(order)}
                        className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-orange-400 font-bold transition"
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-base text-orange-400">{order.id}</span>
                          <span className="text-xs text-neutral-400">({order.createdAt})</span>
                          {order.isNew && (
                            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-neutral-200">
                          {order.customerName} — <a href={`tel:${order.phone}`} className="text-orange-400 hover:underline">{order.phone}</a>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${order.isPaidOnline ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                        {order.isPaidOnline ? 'Payé en ligne' : 'Paie sur place'}
                      </span>

                      <button
                        onClick={() => toggleStatus(order.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                          order.status === 'en_preparation' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                      >
                        {order.status === 'en_preparation' ? '⏳ En préparation' : '✅ Prête'}
                      </button>

                      <button
                        onClick={() => handlePrint(order)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 transition"
                      >
                        🖨️ Imprimer
                      </button>
                    </div>
                  </div>

                  {order.note && (
                    <div className="mt-3 bg-orange-500/10 border border-orange-500/30 p-2.5 rounded-xl text-xs text-orange-300">
                      <span className="font-bold">📝 Note du client :</span> {order.note}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-neutral-800 bg-neutral-950/50 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold uppercase text-orange-400 tracking-wider">Contenu de la commande :</h4>
                      <ul className="space-y-3 text-sm text-neutral-300">
                        {order.items.map((item, idx) => {
                          const details = getDynamicItemDetails(item);
                          return (
                            <li key={idx} className="flex flex-col gap-1 border-b border-neutral-900 pb-2 last:border-0 last:pb-0">
                              <div className="flex justify-between font-medium">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="text-orange-400 font-bold">
                                  {Number(item.finalPrice ?? item.price ?? 0).toFixed(2)} €
                                </span>
                              </div>
                              {details && details.map((d, dIdx) => (
                                <p key={dIdx} className="text-xs text-neutral-400 pl-4">
                                  ↳ <span className="font-semibold text-neutral-300">{d.key} :</span> {d.val}
                                </p>
                              ))}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}