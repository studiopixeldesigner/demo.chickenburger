"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { withBasePath } from '@/lib/base-path';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Product {
  id: string;
  name: string;
  category: string;
  category_id?: string;
  price: number;
  description: string;
  imageUrl?: string;
  inStock: boolean;
  has_menu?: boolean;
  menu_price?: number;
  menu_required?: boolean;
  excluded_option_ids?: string[];
  allowed_options?: string[];
  group_overrides?: { [slug: string]: { enabled?: boolean; is_required?: boolean; max_selectable?: number } };
}

interface DynamicOption {
  id: string;
  name: string;
  type: string;
  price: number;
  inStock: boolean;
}

interface CategoryConfig {
  id: string;
  name: string;
  allowed_options?: string[];
  position?: number;
}

interface OptionTypeConfig {
  id: string;
  slug: string;
  name: string;
  max_selectable?: number;
  min_selectable?: number;
  is_required?: boolean;
}

interface CartItem {
  cartItemId: string;
  id: string;
  name: string;
  category: string;
  category_id?: string;
  basePrice: number;
  finalPrice: number;
  quantity: number;
  nombreViandes?: string;
  nombreGalettes?: string;
  selectedViandes?: { [key: string]: number };
  selectedSauce?: string;
  isMenu?: boolean;
  boisson?: string;
  dynamicSelections?: { [slug: string]: string[] };
}

const STORAGE_KEY = 'chicken_burger_cart';

const RuptureBadge = () => (
  <span className="inline-flex items-center justify-center bg-red-600 text-white font-black text-[10px] px-2 py-1 rounded uppercase tracking-wider">
    RUPTURE
  </span>
);

export default function PageCommander() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<DynamicOption[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [optionTypes, setOptionTypes] = useState<OptionTypeConfig[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const [articleActif, setArticleActif] = useState<Product | null>(null);
  const [nombreViandes, setNombreViandes] = useState<string>("1");
  const [nombreGalettes, setNombreGalettes] = useState<string>("1");
  const [selectedViandes, setSelectedViandes] = useState<{ [key: string]: number }>({});
  const [selectedSauce, setSelectedSauce] = useState<string>("");
  const [isMenu, setIsMenu] = useState<boolean>(false);
  const [selectedBoisson, setSelectedBoisson] = useState<string>("");
  const [directQuantity, setDirectQuantity] = useState<number>(1);
  const [dynamicSelections, setDynamicSelections] = useState<{ [slug: string]: string[] }>({});

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<{ isOpen: boolean; orderNumber: string }>({
    isOpen: false,
    orderNumber: '',
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Erreur sauvegarde panier:", e);
    }
  }, [cart]);

  useEffect(() => {
    async function checkStatus() {
      try {
        const { data } = await supabase.from('settings').select('force_closed, force_open').single();
        if (data?.force_open === true) { setIsOpen(true); return; }
        if (data?.force_closed === true) { setIsOpen(false); return; }

        const now = new Date();
        const day = now.getDay();
        const hourDec = now.getHours() + now.getMinutes() / 60;

        let ouvert = false;
        if (day === 3) ouvert = hourDec >= 18.0 && hourDec < 21.75;
        else if (day === 4 || day === 5) ouvert = (hourDec >= 11.5 && hourDec < 13.75) || (hourDec >= 18.5 && hourDec < 21.75);
        else if (day === 6) ouvert = hourDec >= 18.5 && hourDec < 21.75;
        else if (day === 0 || day === 1) ouvert = hourDec >= 18.0 && hourDec < 21.75;

        setIsOpen(ouvert);
      } catch {
        setIsOpen(false);
      }
    }
    checkStatus();
  }, []);

  useEffect(() => {
    if (isOpen === false) return;
    async function loadData() {
      try {
        const [pRes, oRes, cRes, tRes] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('options').select('*'),
          supabase.from('categories').select('*').order('position', { ascending: true }),
          supabase.from('option_types').select('*'),
        ]);

        if (pRes.data) {
          setProducts(pRes.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            category: item.category,
            category_id: item.category_id,
            price: Number(item.price),
            imageUrl: item.image_url || '',
            inStock: Boolean(item.inStock ?? item.in_stock ?? true),
            has_menu: Boolean(item.has_menu ?? item.hasMenu ?? false),
            menu_price: Number(item.menu_addon ?? item.menu_price ?? 0),
            menu_required: Boolean(item.menu_required ?? false),
            excluded_option_ids: Array.isArray(item.excluded_option_ids) ? item.excluded_option_ids : [],
            allowed_options: Array.isArray(item.allowed_options) ? item.allowed_options : [],
            group_overrides: item.group_overrides || {},
          })));
        }
        if (oRes.data) {
          setOptions(oRes.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            type: String(item.type || '').toLowerCase().trim(),
            price: Number(item.price || 0),
            inStock: Boolean(item.InStock ?? item.inStock ?? item.in_stock ?? true),
          })));
        }
        if (cRes.data) setCategories(cRes.data);
        if (tRes.data) {
          setOptionTypes(tRes.data.map((t: any) => ({
            id: t.id,
            slug: String(t.slug || '').toLowerCase().trim(),
            name: t.name,
            max_selectable: t.max_selectable,
            min_selectable: t.min_selectable ?? (t.is_required ? 1 : 0),
            is_required: t.is_required ?? (t.min_selectable > 0),
          })));
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isOpen]);

  const currentCategoryConfig = useMemo(() => {
    if (!articleActif) return undefined;
    if (articleActif.category_id) {
      return categories.find(c => c.id === articleActif.category_id);
    }
    const prodCat = articleActif.category?.toLowerCase().trim();
    return categories.find(c => c.name.toLowerCase().trim() === prodCat);
  }, [articleActif, categories]);

  const allAllowedSlugs = useMemo(() => {
    if (!articleActif) return [];
    const baseSlugs = (Array.isArray(articleActif.allowed_options) && articleActif.allowed_options.length > 0)
      ? articleActif.allowed_options
      : (currentCategoryConfig?.allowed_options || []);

    const overrides = articleActif.group_overrides || {};
    const slugsSet = new Set<string>(baseSlugs);

    Object.entries(overrides).forEach(([slug, conf]: [string, any]) => {
      if (conf?.enabled === false) {
        slugsSet.delete(slug);
      } else if (conf?.enabled === true) {
        slugsSet.add(slug);
      }
    });

    return Array.from(slugsSet);
  }, [articleActif, currentCategoryConfig]);

  const dynamicAllowedSlugs = useMemo(() => {
    return allAllowedSlugs.filter(slug => {
      const lower = slug.toLowerCase();
      return lower !== 'viande' && lower !== 'sauce';
    });
  }, [allAllowedSlugs]);

  const hasMeat = allAllowedSlugs.includes('viande');
  const hasSauce = allAllowedSlugs.includes('sauce');
  const hasSupplViande = allAllowedSlugs.includes('supplement_viande');
  const hasMenuOption = articleActif?.has_menu === true;
  const excludedIds = articleActif?.excluded_option_ids || [];
  const isTacos = currentCategoryConfig?.name.toLowerCase().includes('tacos') ?? false;

  const rawViandes = useMemo(() => 
    hasMeat ? options.filter(o => o.type === 'viande' && !excludedIds.includes(o.id)) : [],
    [hasMeat, options, excludedIds]
  );
  const rawSupplViandes = useMemo(() => 
    hasSupplViande ? options.filter(o => o.type === 'supplement_viande') : [],
    [hasSupplViande, options]
  );

  const listViandes = useMemo(() => rawViandes.map(v => {
    const matchingSuppl = rawSupplViandes.find(sv => sv.name.toLowerCase().trim() === v.name.toLowerCase().trim());
    return { ...v, inStock: v.inStock && (matchingSuppl ? matchingSuppl.inStock : true) };
  }), [rawViandes, rawSupplViandes]);

  const listSauces = useMemo(() => 
    hasSauce ? options.filter(o => o.type === 'sauce' && !excludedIds.includes(o.id)) : [],
    [hasSauce, options, excludedIds]
  );

  const boissonsData = useMemo(() => {
    if (!hasMenuOption || !isMenu) return [];
    return options.filter(o => 
      o.type.includes('boisson') && !excludedIds.includes(o.id)
    );
  }, [hasMenuOption, isMenu, options, excludedIds]);

  const handleDynamicCheckboxChange = (slug: string, itemName: string, isSingleSelectMode: boolean = false) => {
    const currentList = dynamicSelections[slug] || [];
    const override = articleActif?.group_overrides?.[slug];
    const typeInfo = optionTypes.find(t => t.slug === slug);
    const maxLimit = override?.max_selectable ?? typeInfo?.max_selectable;

    if (isSingleSelectMode) {
      if (currentList.includes(itemName)) {
        setDynamicSelections({ ...dynamicSelections, [slug]: [] });
      } else {
        setDynamicSelections({ ...dynamicSelections, [slug]: [itemName] });
      }
      return;
    }

    if (currentList.includes(itemName)) {
      setDynamicSelections({ ...dynamicSelections, [slug]: currentList.filter(i => i !== itemName) });
    } else {
      if (maxLimit !== undefined && maxLimit > 0 && currentList.length >= maxLimit) return;
      setDynamicSelections({ ...dynamicSelections, [slug]: [...currentList, itemName] });
    }
  };

  const getEffectiveMaxMeatLimit = () => {
    if (isTacos) return parseInt(nombreViandes, 10);
    const override = articleActif?.group_overrides?.['viande']?.max_selectable;
    const typeInfo = optionTypes.find(t => t.slug === 'viande')?.max_selectable;
    return override ?? typeInfo ?? 2;
  };

  const handleViandeCountChange = (viandeName: string, delta: number) => {
    const currentTotal = Object.values(selectedViandes).reduce((a, b) => a + b, 0);
    const maxLimit = getEffectiveMaxMeatLimit();
    const currentCount = selectedViandes[viandeName] || 0;

    if (delta > 0 && currentTotal >= maxLimit) return;
    if (delta < 0 && currentCount <= 0) return;

    const newCount = currentCount + delta;
    const updated = { ...selectedViandes };
    if (newCount === 0) delete updated[viandeName];
    else updated[viandeName] = newCount;
    setSelectedViandes(updated);
  };

  const getTotalViandesSelected = () => Object.values(selectedViandes).reduce((a, b) => a + b, 0);

  const calculateUnitConfigPrice = useMemo(() => {
    if (!articleActif) return 0;
    let total = Number(articleActif.price) || 0;

    if (hasMeat) {
      if (isTacos) {
        if (nombreViandes === "2") total += 1.50;
        if (nombreViandes === "3") {
          total += 3.00;
          if (nombreGalettes === "2") total += 1.50;
        }
      }
      Object.entries(selectedViandes).forEach(([vName, count]) => {
        const found = options.find(o => o.name === vName && o.type === 'viande');
        if (found && !excludedIds.includes(found.id)) total += Number(found.price) * count;
      });
    }

    if (hasSauce && selectedSauce) {
      selectedSauce.split(', ').forEach(sName => {
        const found = options.find(o => o.name === sName.trim() && o.type === 'sauce');
        if (found && !excludedIds.includes(found.id)) total += Number(found.price);
      });
    }

    Object.entries(dynamicSelections).forEach(([slug, selectedNames]) => {
      selectedNames.forEach(name => {
        const found = options.find(o => o.name === name && o.type === slug);
        if (found && !excludedIds.includes(found.id)) total += Number(found.price);
      });
    });

    if (hasMenuOption && isMenu) {
      const boissonPrice = options.find(o => o.name.trim().toLowerCase() === selectedBoisson.trim().toLowerCase() && o.type.includes('boisson'))?.price || 0;
      total += Number(articleActif.menu_price || 0) + Number(boissonPrice);
    }

    const isDirect = allAllowedSlugs.length === 0 && !hasMeat && !hasSauce && !hasMenuOption;
    return isDirect ? total * (directQuantity || 1) : total;
  }, [articleActif, hasMeat, isTacos, nombreViandes, nombreGalettes, selectedViandes, hasSauce, selectedSauce, dynamicSelections, hasMenuOption, isMenu, selectedBoisson, allAllowedSlugs, directQuantity, options, excludedIds]);

  const isFormValid = useMemo(() => {
    if (!articleActif) return false;
    const isDirect = allAllowedSlugs.length === 0 && !hasMeat && !hasSauce && !hasMenuOption;
    if (isDirect) return true;

    const effectiveViandeTarget = hasMeat ? getEffectiveMaxMeatLimit() : 0;
    const validViandes = !hasMeat || (isTacos ? getTotalViandesSelected() === effectiveViandeTarget : getTotalViandesSelected() >= 1);
    
    const currentSauceCount = typeof selectedSauce === 'string' && selectedSauce ? selectedSauce.split(', ').filter(Boolean).length : 0;
    const sauceOverride = articleActif?.group_overrides?.['sauce'];
    const sauceTypeInfo = optionTypes.find(t => t.slug === 'sauce');
    const isSauceRequired = sauceOverride?.is_required ?? sauceTypeInfo?.is_required ?? true;
    const validSauce = !hasSauce || !isSauceRequired || currentSauceCount > 0;
    
    const validMenu = articleActif?.menu_required 
      ? (isMenu && selectedBoisson !== "") 
      : (!isMenu || selectedBoisson !== "");

    const validAllOptions = dynamicAllowedSlugs.every(slug => {
      const override = articleActif?.group_overrides?.[slug];
      const typeInfo = optionTypes.find(t => t.slug === slug);
      const selectedCount = (dynamicSelections[slug] || []).length;
      
      const isRequired = override?.is_required !== undefined 
        ? override.is_required 
        : (typeInfo?.is_required || false);
        
      const minRequired = isRequired ? Math.max(1, typeInfo?.min_selectable || 1) : (typeInfo?.min_selectable || 0);
      return selectedCount >= minRequired;
    });

    return validViandes && validSauce && validMenu && validAllOptions;
  }, [articleActif, allAllowedSlugs, dynamicAllowedSlugs, hasMeat, hasSauce, hasMenuOption, isTacos, nombreViandes, selectedSauce, isMenu, selectedBoisson, optionTypes, dynamicSelections, selectedViandes]);

  const openConfigurator = (product: Product) => {
    setArticleActif(product);
    setNombreViandes("1");
    setNombreGalettes("1");
    setSelectedViandes({});
    setSelectedSauce("");
    setIsMenu(false);
    setSelectedBoisson("");
    setDirectQuantity(1);
    setDynamicSelections({});
  };

  const addToCart = () => {
    if (!articleActif) return;
    const isDirect = allAllowedSlugs.length === 0 && !hasMeat && !hasSauce && !hasMenuOption;
    const qty = isDirect ? directQuantity : 1;
    const unitPriceConfig = isDirect ? Number(articleActif.price) : calculateUnitConfigPrice;
    
    const itemSignature = JSON.stringify({
      id: articleActif.id,
      nombreViandes,
      nombreGalettes,
      selectedViandes,
      selectedSauce,
      isMenu,
      selectedBoisson,
      dynamicSelections,
    });

    setCart(prev => {
      const existingIdx = prev.findIndex(item => {
        const sig = JSON.stringify({
          id: item.id,
          nombreViandes: item.nombreViandes,
          nombreGalettes: item.nombreGalettes,
          selectedViandes: item.selectedViandes,
          selectedSauce: item.selectedSauce,
          isMenu: item.isMenu,
          selectedBoisson: item.boisson,
          dynamicSelections: item.dynamicSelections,
        });
        return sig === itemSignature;
      });

      if (existingIdx > -1) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + qty;
        copy[existingIdx].quantity = newQty;
        copy[existingIdx].finalPrice = copy[existingIdx].basePrice * newQty;
        return copy;
      }

      const newItem: CartItem = {
        cartItemId: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        id: articleActif.id,
        name: articleActif.name,
        category: articleActif.category,
        category_id: articleActif.category_id,
        basePrice: unitPriceConfig,
        finalPrice: unitPriceConfig * qty,
        quantity: qty,
        nombreViandes: hasMeat && isTacos ? nombreViandes : undefined,
        nombreGalettes: hasMeat && isTacos && nombreViandes === "3" ? nombreGalettes : undefined,
        selectedViandes: hasMeat ? { ...selectedViandes } : undefined,
        selectedSauce: hasSauce ? selectedSauce || undefined : undefined,
        isMenu: isMenu,
        boisson: selectedBoisson || undefined,
        dynamicSelections: { ...dynamicSelections },
      };
      return [...prev, newItem];
    });

    setArticleActif(null);
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          finalPrice: item.basePrice * newQty,
        };
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const getTotalCartItemsCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalCartPrice = () => cart.reduce((sum, item) => sum + item.finalPrice, 0);

  const displayedCategories = useMemo(() => {
    if (activeCategoryFilter === "all") return categories;
    return categories.filter(c => c.id === activeCategoryFilter);
  }, [categories, activeCategoryFilter]);

  const handleValidateOrder = async () => {
    if (!customerName.trim()) { alert("Veuillez renseigner votre nom."); return; }
    if (!/^\d{10}$/.test(phone.trim())) { alert("Téléphone invalide (10 chiffres requis)."); return; }

    setIsSubmitting(true);
    try {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const nextNum = (count || 0) + 1;
      const orderNumberFormatted = `CMD-${String(nextNum).padStart(3, '0')}`;

      const { error } = await supabase.from('orders').insert([{
        order_number: orderNumberFormatted,
        customer_name: customerName,
        phone: phone.trim(),
        note: orderNote.trim() || null,
        is_paid_online: true,
        status: 'en_preparation',
        items: cart,
      }]);

      if (error) throw error;

      setCart([]);
      localStorage.removeItem(STORAGE_KEY);
      setIsCartOpen(false);
      setCustomerName(''); setPhone(''); setOrderNote('');
      setOrderSuccessModal({ isOpen: true, orderNumber: orderNumberFormatted });
    } catch {
      alert("Erreur lors de la validation de la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isOpen === null) {
    return <main className="min-h-screen bg-[#40342C] text-[#FAF6F0] flex items-center justify-center text-xs font-bold text-emerald-400">Vérification des horaires...</main>;
  }

  if (!isOpen) {
    return (
      <main className="min-h-screen bg-[#40342C] text-[#FAF6F0] flex items-center justify-center p-6">
        <div className="bg-[#372D26] border border-[#59493E] rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="relative w-16 h-16 mx-auto overflow-hidden rounded-full border-2 border-emerald-500 shadow-lg animate-bounce">
            <Image src={withBasePath('/logo.png')} alt="Logo" fill className="object-cover" />
          </div>
          <h1 className="text-xl font-black uppercase text-white">Restaurant Fermé</h1>
          <p className="text-xs text-[#CBC0B4]">Les commandes en ligne sont désactivées. À bientôt !</p>
          <Link href="/" className="block w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3 rounded-2xl text-sm transition">Retour à l&apos;accueil</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#40342C] text-[#FAF6F0] flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      <div>
        {/* HEADER HARMONISÉ FIXE */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#372D26]/95 backdrop-blur-md border-b border-[#59493E] flex items-center justify-between px-6 py-4 shadow-md">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 transform group-hover:scale-110 transition duration-300">
              <Image src={withBasePath('/logo.png')} alt="Logo" fill className="object-cover" />
            </div>
            <span className="font-black text-lg tracking-tighter text-white">
              CHICKEN <span className="text-orange-400">BURGER</span>
            </span>
          </Link>
          <button onClick={() => setIsCartOpen(true)} className="bg-[#4E3F35] hover:bg-[#5E4C40] text-white px-5 py-2.5 rounded-full font-bold text-sm border border-[#6B5749] flex items-center gap-3 transition shadow-md">
            <span>Panier</span>
            <span className="bg-emerald-500 text-white text-xs px-2.5 py-0.5 rounded-full font-black">{getTotalCartItemsCount()}</span>
          </button>
        </header>

        {/* HERO / TITRE */}
        <div className="max-w-6xl mx-auto px-4 pt-28 pb-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400">Notre Carte & Menus</h1>
          <p className="text-[#F5F0E8] text-sm">Faites votre choix et personnalisez votre commande en un clic</p>
        </div>

        {/* NAVIGATION RAPIDE PAR CATÉGORIE */}
        {!loading && categories.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mb-8">
            <div className="md:hidden">
              <select
                value={activeCategoryFilter}
                onChange={(e) => setActiveCategoryFilter(e.target.value)}
                className="w-full bg-[#372D26] text-white border border-[#59493E] rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tous les produits</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden md:flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setActiveCategoryFilter("all")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition border ${
                  activeCategoryFilter === "all"
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                    : 'bg-[#372D26] text-[#CBC0B4] border-[#59493E] hover:text-white'
                }`}
              >
                Tous les produits
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition border ${
                    activeCategoryFilter === cat.id
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                      : 'bg-[#372D26] text-[#CBC0B4] border-[#59493E] hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CATALOGUE PRODUITS */}
        <section className="max-w-6xl mx-auto px-4 space-y-16 pb-16">
          {loading ? (
            <div className="text-center py-20 text-emerald-400 font-bold">Chargement...</div>
          ) : (
            displayedCategories.map((catConfig) => {
              const catProducts = products.filter(p => 
                p.category_id ? p.category_id === catConfig.id : p.category?.toLowerCase().trim() === catConfig.name.toLowerCase().trim()
              );
              if (catProducts.length === 0) return null;

              return (
                <div key={catConfig.id} className="space-y-6">
                  <h2 className="text-2xl font-black uppercase tracking-wider border-b border-[#59493E] pb-3 text-emerald-400 inline-block">{catConfig.name}</h2>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {catProducts.map((article) => {
                      const opts = (article.allowed_options && article.allowed_options.length > 0) ? article.allowed_options : (catConfig.allowed_options || []);
                      const isCatDirect = opts.length === 0 && !article.has_menu;
                      return (
                        <div key={article.id} className={`group p-6 rounded-3xl border transition duration-300 flex flex-col justify-between relative overflow-hidden ${article.inStock ? "bg-[#372D26]/90 border-[#59493E] hover:border-emerald-500/60 shadow-xl" : "bg-[#372D26]/40 border-[#59493E]/40 opacity-50"}`}>
                          <div className="relative z-10">
                            {article.imageUrl && (
                              <div className="relative w-full h-40 mb-4 overflow-hidden rounded-2xl bg-[#40342C] border border-[#59493E]">
                                <Image src={article.imageUrl} alt={article.name} fill className="object-cover group-hover:scale-105 transition duration-500" />
                              </div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-xl text-white">{article.name}</h3>
                                {!article.inStock && <div className="mt-1"><RuptureBadge /></div>}
                              </div>
                              <span className="font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-sm border border-emerald-500/20">{article.price.toFixed(2)} €</span>
                            </div>
                            <p className="text-sm text-[#F5F0E8] mb-6">{article.description}</p>
                          </div>
                          <button
                            disabled={!article.inStock}
                            onClick={() => openConfigurator(article)}
                            className={`relative z-10 w-full py-3.5 rounded-2xl font-bold uppercase text-xs transition duration-300 ${article.inStock ? "bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 text-white shadow-lg" : "bg-[#4E3F35] text-[#CBC0B4] cursor-not-allowed"}`}
                          >
                            {article.inStock ? (isCatDirect ? "+ Ajouter au panier" : "+ Personnaliser & Ajouter") : "Rupture de stock"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* FOOTER HARMONISÉ */}
      <footer className="bg-[#332922] border-t border-[#59493E] pt-16 pb-12 text-[#E2D8CC] text-sm relative z-20">
        <div className="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-4 mb-12 text-left">
          <div>
            <h4 className="text-white font-black text-base uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Chicken Burger Lure
            </h4>
            <p className="mb-4 leading-relaxed text-xs text-[#CBC0B4]">
              Spécialiste du tacos garni et du burger croustillant. Qualité irréprochable et produits frais garantis.
            </p>
            <div className="space-y-2 text-xs">
              <p><strong className="text-white">Viandes :</strong> Origine France, Pologne, Allemagne (Certifiées Halal).</p>
              <p><strong className="text-white">Adresse : </strong><a href="https://www.google.com/maps/search/?api=1&query=34+Rue+de+la+Gare,+70200+Lure" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">34 Rue de la Gare, 70200 Lure</a></p>
              <p><strong className="text-white">Téléphone : </strong><a href="tel:0363751530" className="text-emerald-400 hover:underline">03 63 75 15 30</a></p>
            </div>
          </div>
          <div>
            <h4 className="text-white font-black text-base uppercase tracking-wider mb-4">Horaires</h4>
            <ul className="space-y-1.5 text-xs text-[#F5F0E8]">
              <li><strong className="text-white">Lundi :</strong> 18:00 - 22:00</li>
              <li><strong className="text-white">Mardi :</strong> <span className="text-rose-400 font-bold">Fermé</span></li>
              <li><strong className="text-white">Mercredi :</strong> 17:30 - 22:00</li>
              <li><strong className="text-white">Jeudi :</strong> 11:00 - 14:00 / 18:00 - 22:00</li>
              <li><strong className="text-white">Vendredi :</strong> 11:00 - 14:00 / 18:00 - 22:00</li>
              <li><strong className="text-white">Samedi :</strong> 18:00 - 22:00</li>
              <li><strong className="text-white">Dimanche :</strong> 17:30 - 22:00</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black text-base uppercase tracking-wider mb-4">Informations</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><Link href="/menu" className="hover:text-orange-400 transition">Menu</Link></li>
              <li><Link href="/suivi" className="hover:text-orange-400 transition">Suivi de commande</Link></li>
              <li><Link href="/provenance-viandes" className="hover:text-orange-400 transition">Provenance des viandes</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-orange-400 transition">Mentions légales</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black text-base uppercase tracking-wider mb-4">Nous trouver</h4>
            <div className="rounded-2xl overflow-hidden border border-[#59493E] h-40 shadow-inner">
              <iframe title="Carte 34 Rue de la Gare Lure" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2728.895316335193!2d6.4912!3d47.6845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47923a1820b33b9f%3A0x6b8a8b13c1234567!2s34+Rue+de+la+Gare%2C+70200+Lure!5e0!3m2!1sfr!2sfr!4v1650000000000!5m2!1sfr!2sfr" width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy"></iframe>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 border-t border-[#59493E] pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-[#B8ABA0]">
          <p>© 2026 Chicken Burger Lure. Tous droits réservés.</p>
          <p className="mt-2 sm:mt-0"><a href="https://www.google.com/maps/search/?api=1&query=34+Rue+de+la+Gare,+70200+Lure" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">34 Rue de la Gare, 70200 Lure</a> — Tél : <a href="tel:0363751530" className="hover:text-white transition">03 63 75 15 30</a></p>
          <p className="mt-1">Powered by <a href="https://studiopixeldesigner.github.io/pixeldesigner" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline font-semibold transition">Pixel Designer</a></p>
        </div>
      </footer>

      {/* MODAL CONFIGURATION PRODUIT */}
      {articleActif && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="bg-[#372D26] border border-[#59493E] w-full max-w-lg sm:rounded-3xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#59493E] pb-4">
              <div>
                <h3 className="text-xl font-black text-white">{articleActif.name}</h3>
                <p className="text-emerald-400 font-bold text-sm">Total estimé : {calculateUnitConfigPrice.toFixed(2)} €</p>
              </div>
              <button onClick={() => setArticleActif(null)} className="bg-[#4E3F35] hover:bg-[#5E4C40] text-white rounded-full w-9 h-9 flex items-center justify-center font-bold">✕</button>
            </div>

            {allAllowedSlugs.length === 0 && !hasMeat && !hasSauce && !hasMenuOption ? (
              <div className="space-y-4 py-4">
                <h4 className="font-bold text-white text-xs uppercase">Quantité</h4>
                <div className="flex items-center justify-center gap-4">
                  <button type="button" onClick={() => setDirectQuantity(Math.max(1, directQuantity - 1))} className="w-10 h-10 bg-[#4E3F35] border border-[#59493E] rounded-xl font-bold text-lg text-white">-</button>
                  <span className="text-lg font-bold text-white w-8 text-center">{directQuantity}</span>
                  <button type="button" onClick={() => setDirectQuantity(directQuantity + 1)} className="w-10 h-10 bg-[#4E3F35] border border-[#59493E] rounded-xl font-bold text-lg text-white">+</button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {hasMeat && (
                  <div className="space-y-4">
                    {isTacos && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-white text-xs uppercase">Nombre de viandes (Obligatoire)</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "1", label: "1 Viande", priceText: "Base" },
                            { id: "2", label: "2 Viandes", priceText: "+1.50 €" },
                            { id: "3", label: "3 Viandes", priceText: "+3.00 €" },
                          ].map(opt => (
                            <button key={opt.id} type="button" onClick={() => { setNombreViandes(opt.id); setSelectedViandes({}); if (opt.id !== "3") setNombreGalettes("1"); }} className={`p-3 rounded-2xl border text-center transition ${nombreViandes === opt.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-[#59493E] bg-[#40342C] text-[#F5F0E8]'}`}>
                              <span className="block text-xs font-bold">{opt.label}</span>
                              <span className="block text-[10px] text-[#CBC0B4]">{opt.priceText}</span>
                            </button>
                          ))}
                        </div>
                        {nombreViandes === "3" && (
                          <div className="pt-2">
                            <h4 className="font-bold text-white text-xs uppercase mb-2">Nombre de galettes</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {[{ id: "1", label: "1 Galette", priceText: "Base" }, { id: "2", label: "2 Galettes", priceText: "+1.50 €" }].map(opt => (
                                <button key={opt.id} type="button" onClick={() => setNombreGalettes(opt.id)} className={`p-3 rounded-2xl border text-center transition ${nombreGalettes === opt.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-[#59493E] bg-[#40342C] text-[#F5F0E8]'}`}>
                                  <span className="block text-xs font-bold">{opt.label}</span>
                                  <span className="block text-[10px] text-[#CBC0B4]">{opt.priceText}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {listViandes.length > 0 && (() => {
                      const maxMeatLimit = getEffectiveMaxMeatLimit();
                      const currentMeatTotal = getTotalViandesSelected();
                      const isMeatMaxReached = currentMeatTotal >= maxMeatLimit;

                      return (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-white text-xs uppercase">
                              Sélection des viandes ({currentMeatTotal}/{maxMeatLimit}) <span className="text-emerald-400">*</span>
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {listViandes.map(vObj => {
                              const count = selectedViandes[vObj.name] || 0;
                              const canAddMore = !isMeatMaxReached || count > 0;

                              return (
                                <div key={vObj.id} className={`flex items-center justify-between p-2.5 bg-[#40342C] border rounded-2xl ${!vObj.inStock ? 'opacity-40 border-neutral-900' : 'border-[#59493E]'}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-white">{vObj.name}</span>
                                    {!vObj.inStock && <RuptureBadge />}
                                    {vObj.price > 0 && <span className="text-[10px] text-emerald-400 font-bold">+{vObj.price.toFixed(2)} €</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" disabled={!vObj.inStock || count <= 0} onClick={() => handleViandeCountChange(vObj.name, -1)} className="w-7 h-7 bg-[#4E3F35] border border-[#6B5749] rounded-xl disabled:opacity-35 text-white font-bold">-</button>
                                    <span className="text-xs font-bold text-white w-4 text-center">{count}</span>
                                    <button type="button" disabled={!vObj.inStock || !canAddMore} onClick={() => handleViandeCountChange(vObj.name, 1)} className="w-7 h-7 bg-[#4E3F35] border border-[#6B5749] rounded-xl disabled:opacity-35 text-white font-bold">+</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {hasSauce && listSauces.length > 0 && (() => {
  const sauceOverride = articleActif?.group_overrides?.['sauce'];
  const sauceTypeInfo = optionTypes.find(t => t.slug === 'sauce');
  const maxSauceLimit = sauceOverride?.max_selectable ?? sauceTypeInfo?.max_selectable ?? 1;
  const isRequired = sauceOverride?.is_required ?? sauceTypeInfo?.is_required ?? true;
  
  const currentSauces: string[] = typeof selectedSauce === 'string' && selectedSauce 
    ? selectedSauce.split(', ').filter(Boolean) 
    : [];

  const totalSaucesCount = currentSauces.length;

  const handleSauceCheckboxChange = (sName: string) => {
    const isSelected = currentSauces.includes(sName);
    if (isSelected) {
      const copy = currentSauces.filter(s => s !== sName);
      setSelectedSauce(copy.join(', '));
    } else {
      if (maxSauceLimit > 0 && totalSaucesCount >= maxSauceLimit) return;
      setSelectedSauce([...currentSauces, sName].join(', '));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-white text-xs uppercase">
          Choix de la sauce ({totalSaucesCount}/{maxSauceLimit}) 
          {isRequired && <span className="text-emerald-400 ml-1">*</span>}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {listSauces.map(sObj => {
          const isSelected = currentSauces.includes(sObj.name);
          const isOutOfStock = !sObj.inStock;
          const isDisabled = isOutOfStock || (!isSelected && maxSauceLimit > 0 && totalSaucesCount >= maxSauceLimit);

          return (
            <label 
              key={sObj.id} 
              className={`flex items-center justify-between p-3 bg-[#40342C] border rounded-2xl transition ${
                isOutOfStock ? 'opacity-40 pointer-events-none border-neutral-900' : isDisabled ? 'opacity-50 cursor-not-allowed border-[#59493E]' : 'cursor-pointer'
              } ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#59493E]'}`}
            >
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  disabled={isDisabled} 
                  checked={isSelected} 
                  onChange={() => handleSauceCheckboxChange(sObj.name)} 
                  className="accent-emerald-500 rounded" 
                />
                <span className="text-xs font-medium text-white">{sObj.name}</span>
                {isOutOfStock && <RuptureBadge />}
              </div>
              {sObj.price > 0 && <span className="text-[10px] text-emerald-400 font-bold">+{sObj.price.toFixed(2)} €</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
})()}

                {dynamicAllowedSlugs.map(slug => {
                  if (slug === 'boisson') return null;
                  const optionTypeInfo = optionTypes.find(t => t.slug === slug);
                  const typeOptions = options.filter(o => o.type === slug && !excludedIds.includes(o.id));
                  if (typeOptions.length === 0) return null;

                  const override = articleActif?.group_overrides?.[slug];
                  const selectedList = dynamicSelections[slug] || [];
                  const maxLimit = override?.max_selectable ?? optionTypeInfo?.max_selectable;
                  const minLimit = override?.is_required !== undefined 
                    ? (override.is_required ? 1 : 0) 
                    : (optionTypeInfo?.min_selectable ?? (optionTypeInfo?.is_required ? 1 : 0));
                  const isMaxReached = maxLimit ? selectedList.length >= maxLimit : false;

                  const groupName = optionTypeInfo?.name || slug;
                  const isCheckboxMode = maxLimit === 1 && !groupName.toLowerCase().includes('supplément');

                  return (
                    <div key={slug}>
                      <h4 className="font-bold text-white text-xs uppercase mb-2 flex items-center justify-between">
                        <span>{groupName} {minLimit > 0 && <span className="text-emerald-400">*</span>}</span>
                        <span className="text-[10px] text-[#CBC0B4] font-normal">{minLimit > 0 ? `(min: ${minLimit}) ` : ''}{maxLimit ? `(max: ${maxLimit})` : ''}</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {typeOptions.map(opt => {
                          const isSelected = selectedList.includes(opt.name);
                          const isOutOfStock = !opt.inStock;
                          const isDisabled = isOutOfStock || (!isCheckboxMode && isMaxReached && !isSelected);
                          
                          if (isCheckboxMode) {
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => handleDynamicCheckboxChange(slug, opt.name, true)}
                                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition ${
                                  isOutOfStock ? 'opacity-40 pointer-events-none border-neutral-900 bg-[#40342C] text-neutral-500' : isSelected ? 'border-emerald-500 bg-emerald-500/15 text-white' : 'border-[#59493E] bg-[#40342C] text-[#F5F0E8]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{opt.name}</span>
                                  {isOutOfStock && <RuptureBadge />}
                                </div>
                                {opt.price > 0 && <span className="text-[10px] text-emerald-400 font-bold">+{opt.price.toFixed(2)} €</span>}
                              </button>
                            );
                          }

                          return (
                            <label key={opt.id} className={`flex items-center justify-between p-3 bg-[#40342C] border rounded-2xl ${isDisabled ? 'opacity-40 pointer-events-none border-neutral-900' : 'cursor-pointer'} ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#59493E]'}`}>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" disabled={isDisabled} checked={isSelected} onChange={() => handleDynamicCheckboxChange(slug, opt.name, false)} className="accent-emerald-500 rounded" />
                                <span className="text-xs font-medium text-white">{opt.name}</span>
                                {isOutOfStock && <RuptureBadge />}
                              </div>
                              {opt.price > 0 && <span className="text-[10px] text-emerald-400 font-bold">+{opt.price.toFixed(2)} €</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {hasMenuOption && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-xs uppercase">
                          Passer en Menu {articleActif?.menu_required && <span className="text-emerald-400">*</span>}
                        </h4>
                        {Number(articleActif?.menu_price || 0) > 0 && (
                          <span className="text-xs text-emerald-400 font-bold">
                            (+{Number(articleActif.menu_price).toFixed(2)} €)
                          </span>
                        )}
                      </div>
                      <input type="checkbox" checked={isMenu} onChange={(e) => { setIsMenu(e.target.checked); if (!e.target.checked) setSelectedBoisson(""); }} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                    </div>

                    {isMenu && (
                      <div className="mt-3 space-y-2">
                        <h5 className="text-[11px] text-emerald-400 uppercase font-bold">Choix de la boisson <span className="text-emerald-400">*</span></h5>
                        {boissonsData.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {boissonsData.map(boisson => {
                              const isOutOfStock = !boisson.inStock;
                              return (
                                <label key={boisson.id} className={`flex items-center justify-between p-3 bg-[#40342C] border rounded-2xl ${isOutOfStock ? 'opacity-40 pointer-events-none border-neutral-900' : 'cursor-pointer border-[#59493E]'}`}>
                                  <div className="flex items-center gap-2">
                                    <input type="radio" disabled={isOutOfStock} name="boissonChoice" checked={selectedBoisson === boisson.name} onChange={() => setSelectedBoisson(boisson.name)} className="accent-emerald-500" />
                                    <span className="text-xs font-medium text-white">{boisson.name}</span>
                                    {isOutOfStock && <RuptureBadge />}
                                  </div>
                                  {boisson.price > 0 && <span className="text-[10px] text-emerald-400 font-bold">+{boisson.price.toFixed(2)} €</span>}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-orange-400">Aucune boisson disponible.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isFormValid ? (
              <button onClick={addToCart} className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 text-white font-black text-xs uppercase py-4 rounded-2xl shadow-lg">
                Ajouter au panier ({calculateUnitConfigPrice.toFixed(2)} €)
              </button>
            ) : (
              <div className="text-center text-xs text-[#CBC0B4] font-bold py-2">
                Veuillez compléter tous les choix obligatoires (marqués d&apos;un *) pour continuer.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANIER SLIDE-OVER */}
      {isCartOpen && (
        <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex justify-end">
          <div onClick={(e) => e.stopPropagation()} className="bg-[#372D26] border-l border-[#59493E] w-full max-w-md h-full flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex justify-between items-center border-b border-[#59493E] pb-4 mb-6">
                <h3 className="text-xl font-black text-white">Votre Panier</h3>
                <button onClick={() => setIsCartOpen(false)} className="bg-[#4E3F35] hover:bg-[#5E4C40] text-white rounded-full w-9 h-9 flex items-center justify-center font-bold">✕</button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 text-[#CBC0B4] font-bold text-base">Votre panier est vide</div>
              ) : (
                cart.map((item) => {
                  return (
                    <div key={item.cartItemId} className="bg-[#40342C] border border-[#59493E] p-4 rounded-2xl relative space-y-2 mb-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-sm">{item.name}</h4>
                        <span className="font-black text-emerald-400 text-sm">{item.finalPrice.toFixed(2)} €</span>
                      </div>
                      
                      <div className="text-[11px] text-[#F5F0E8] space-y-0.5 pt-1 border-t border-[#59493E]">
                        {!item.nombreViandes && !item.selectedSauce && (!item.dynamicSelections || Object.keys(item.dynamicSelections).length === 0) && !item.isMenu && (
                          <p className="text-[#CBC0B4] italic">Article standard</p>
                        )}
                        {item.nombreViandes && (
                          <p>
                            <span className="font-bold text-white">Viandes ({item.nombreViandes}) :</span>{' '}
                            {Object.entries(item.selectedViandes || {}).map(([k, v]) => `${v}x ${k}`).join(', ')}
                          </p>
                        )}
                        {item.nombreGalettes && item.nombreGalettes !== "1" && (
                          <p><span className="font-bold text-white">Galettes :</span> {item.nombreGalettes} Galettes</p>
                        )}
                        {item.selectedSauce && (
                          <p><span className="font-bold text-white">Sauce :</span> {item.selectedSauce}</p>
                        )}
                        {item.dynamicSelections && Object.entries(item.dynamicSelections).map(([slug, values]) => {
                          if (!values || values.length === 0) return null;
                          const typeInfo = optionTypes.find(t => t.slug === slug);
                          return (
                            <p key={slug}>
                              <span className="font-bold text-white">{typeInfo?.name || slug} :</span> {values.join(', ')}
                            </p>
                          );
                        })}
                        {item.isMenu && (
                          <p className="text-emerald-400 font-semibold pt-0.5">
                            📦 Menu {item.boisson ? `+ Boisson (${item.boisson})` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#59493E]/60">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateCartItemQuantity(item.cartItemId, -1)} className="w-6 h-6 bg-[#4E3F35] border border-[#6B5749] rounded-lg text-xs font-bold text-white">-</button>
                          <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => updateCartItemQuantity(item.cartItemId, 1)} className="w-6 h-6 bg-[#4E3F35] border border-[#6B5749] rounded-lg text-xs font-bold text-white">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-400 hover:text-red-300 text-xs font-bold">Supprimer</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-[#59493E]">
              {cart.length > 0 && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase text-[#CBC0B4]">Note pour la commande</label>
                      <span className={`text-[10px] font-bold ${orderNote.length >= 80 ? 'text-red-400' : 'text-[#CBC0B4]'}`}>{orderNote.length}/80</span>
                    </div>
                    <textarea placeholder="Ex: Sans oignons..." maxLength={80} rows={2} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} className="w-full bg-[#40342C] border border-[#59493E] rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none" />
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-white">Total :</span>
                    <span className="text-emerald-400 text-base font-black">{getTotalCartPrice().toFixed(2)} €</span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-emerald-400">Vos Coordonnées</h4>
                    <input type="text" placeholder="PRÉNOM" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-[#40342C] border border-[#59493E] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500" />
                    <input type="tel" placeholder="Téléphone (10 chiffres, ex: 0612345678)" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full bg-[#40342C] border border-[#59493E] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500" />
                  </div>

                  <button disabled={isSubmitting} onClick={handleValidateOrder} className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 text-white font-black text-xs uppercase py-4 rounded-2xl shadow-lg disabled:opacity-50">
                    {isSubmitting ? "Validation..." : "Procéder au paiement"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUCCÈS COMMANDE */}
      {orderSuccessModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#372D26] border border-[#59493E] w-full max-w-sm rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto overflow-hidden rounded-full border-2 border-emerald-500 shadow-lg animate-bounce">
              <Image src={withBasePath('/logo.png')} alt="Logo Chicken" fill className="object-cover" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Merci pour votre commande !</h3>
              <p className="text-[#F5F0E8] text-sm">Votre numéro de commande est le <span className="font-black text-emerald-400">{orderSuccessModal.orderNumber}</span></p>
            </div>
            <div className="pt-2 space-y-2">
              <button onClick={() => router.push(`/suivi?order=${orderSuccessModal.orderNumber}`)} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-xs uppercase py-3.5 rounded-2xl shadow-lg">Suivre votre commande</button>
              <button onClick={() => setOrderSuccessModal({ isOpen: false, orderNumber: '' })} className="w-full bg-[#4E3F35] text-[#CBC0B4] font-bold text-xs py-2.5 rounded-2xl">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}