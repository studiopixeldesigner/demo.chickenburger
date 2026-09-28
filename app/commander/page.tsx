"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { withBasePath } from '@/lib/base-path';
import { IS_DEMO, saveDemoOrder, useDemoOuvert } from '@/lib/demo';
import SiteHeader from '@/app/_components/SiteHeader';
import SiteFooter from '@/app/_components/SiteFooter';
import Bump from '@/app/_components/Bump';
import ChipScroller from '@/app/_components/ChipScroller';
import { CategoryHeading, PageIntro, PriceTag, inputClass, labelClass } from '@/app/_components/ui';
import {
  IconArrowLeft,
  IconBag,
  IconCheck,
  IconCup,
  IconInfo,
  IconLock,
  IconMinus,
  IconPlus,
  IconTrash,
  IconX,
} from '@/app/_components/icons';

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

// Confettis de la fenêtre de confirmation (positions fixes, animées en CSS).
const CONFETTI = [
  { x: '126px', y: '-10px', r: '-180deg', d: '0ms', color: 'var(--color-cheddar)', round: true },
  { x: '152px', y: '30px', r: '-97deg', d: '40ms', color: 'var(--color-ketchup)', round: false },
  { x: '92px', y: '43px', r: '-14deg', d: '80ms', color: '#fffbf5', round: false },
  { x: '63px', y: '86px', r: '69deg', d: '120ms', color: '#fce5c8', round: true },
  { x: '-4px', y: '73px', r: '152deg', d: '160ms', color: 'var(--color-cheddar)', round: false },
  { x: '-49px', y: '49px', r: '-125deg', d: '200ms', color: 'var(--color-ketchup)', round: false },
  { x: '-122px', y: '57px', r: '-42deg', d: '0ms', color: '#fffbf5', round: true },
  { x: '-135px', y: '19px', r: '41deg', d: '40ms', color: '#fce5c8', round: false },
  { x: '-202px', y: '-7px', r: '124deg', d: '80ms', color: 'var(--color-cheddar)', round: false },
  { x: '-169px', y: '-45px', r: '-153deg', d: '120ms', color: 'var(--color-ketchup)', round: true },
  { x: '-121px', y: '-69px', r: '-70deg', d: '160ms', color: '#fffbf5', round: false },
  { x: '-119px', y: '-114px', r: '13deg', d: '200ms', color: '#fce5c8', round: false },
  { x: '-51px', y: '-115px', r: '96deg', d: '0ms', color: 'var(--color-cheddar)', round: true },
  { x: '3px', y: '-102px', r: '179deg', d: '40ms', color: 'var(--color-ketchup)', round: false },
  { x: '66px', y: '-124px', r: '-98deg', d: '80ms', color: '#fffbf5', round: false },
  { x: '98px', y: '-91px', r: '-15deg', d: '120ms', color: '#fce5c8', round: true },
  { x: '174px', y: '-81px', r: '68deg', d: '160ms', color: 'var(--color-cheddar)', round: false },
  { x: '166px', y: '-40px', r: '151deg', d: '200ms', color: 'var(--color-ketchup)', round: false },
];

const RuptureBadge = () => (
  <span className="inline-flex items-center justify-center rounded bg-ketchup px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-white">
    RUPTURE
  </span>
);

function RequiredMark() {
  return (
    <>
      <span className="ml-1 text-ketchup" aria-hidden="true">*</span>
      <span className="sr-only"> (obligatoire)</span>
    </>
  );
}

function OptionHeading({ title, required, meta }: { title: React.ReactNode; required?: boolean; meta?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h4 className="text-xs font-bold uppercase tracking-[0.12em]">
        {title}
        {required && <RequiredMark />}
      </h4>
      {meta && <span className="shrink-0 text-xs font-semibold text-grill-soft tabular-nums">{meta}</span>}
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  size = 'md',
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  size?: 'md' | 'lg';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid place-items-center rounded-md bg-crumb text-grill transition duration-150 hover:bg-sesame active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-crumb ${
        size === 'lg' ? 'size-12' : 'size-8'
      }`}
    >
      {children}
    </button>
  );
}

function ExtraPrice({ price, inverted = false }: { price: number; inverted?: boolean }) {
  if (price <= 0) return null;
  return (
    <span className={`shrink-0 text-xs font-bold tabular-nums ${inverted ? "text-white/90" : "text-pickle-ink"}`}>
      +{price.toFixed(2)} €
    </span>
  );
}

export default function PageCommander() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const demoOuvert = useDemoOuvert();
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
    if (IS_DEMO) return;

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
      let orderNumberFormatted = '';

      if (IS_DEMO) {
        // Démo : la commande reste dans le navigateur du visiteur, rien n'est envoyé au restaurant.
        await new Promise((resolve) => setTimeout(resolve, 700));
        orderNumberFormatted = saveDemoOrder({
          customerName,
          phone: phone.trim(),
          note: orderNote.trim() || null,
          items: cart,
        });
      } else {
        const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const nextNum = (count || 0) + 1;
        orderNumberFormatted = `CMD-${String(nextNum).padStart(3, '0')}`;

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
      }

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

  // Fenêtres ouvertes : on bloque le défilement de la page et Échap ferme la fenêtre active.
  useEffect(() => {
    const hasOverlay = Boolean(articleActif) || isCartOpen || orderSuccessModal.isOpen;
    if (!hasOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (articleActif) setArticleActif(null);
      else if (isCartOpen) setIsCartOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [articleActif, isCartOpen, orderSuccessModal.isOpen]);

  // Petite notification après un ajout au panier.
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAddToCart = () => {
    if (!articleActif) return;
    const productName = articleActif.name;
    addToCart();
    setToast({ id: Date.now(), text: `${productName} ajouté au panier` });
  };

  const restaurantOuvert = IS_DEMO ? demoOuvert : isOpen;

  if (restaurantOuvert === null) {
    return (
      <main className="flex min-h-dvh flex-1 items-center justify-center p-6">
        <p role="status" className="flex items-center gap-3 text-sm font-semibold text-grill-soft">
          <span className="size-2.5 animate-pulse rounded-sm bg-pickle" aria-hidden="true" />
          Vérification des horaires...
        </p>
      </main>
    );
  }

  if (!restaurantOuvert) {
    return (
      <main className="flex min-h-dvh flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md animate-rise overflow-hidden rounded-2xl bg-crumb text-center">
          <div className="flex items-center justify-center gap-2 bg-ketchup py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
            <IconLock className="size-4" />
            Commandes en ligne fermées
          </div>
          <div className="space-y-5 p-8">
            <div className="relative mx-auto size-20 overflow-hidden rounded-full">
              <Image src={withBasePath('/logo.png')} alt="Logo Chicken Burger" fill sizes="80px" className="object-cover" />
            </div>
            <h1 className="font-display text-5xl uppercase leading-none">Restaurant fermé</h1>
            <p className="text-sm text-grill-soft">Les commandes en ligne sont désactivées. À bientôt !</p>
            {IS_DEMO && (
              <p className="rounded-lg bg-cheddar-light px-4 py-3 text-sm text-grill">
                <strong>Démo :</strong> repassez le restaurant sur « Ouvert » dans la bannière en haut de page pour tester la commande.
              </p>
            )}
            <Link
              href="/"
              className="btn btn-grill flex w-full py-3.5 text-sm"
            >
              <IconArrowLeft className="size-4" />
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const cartCount = getTotalCartItemsCount();
  const showCartBar = cart.length > 0 && !isCartOpen && !articleActif && !orderSuccessModal.isOpen;
  const isDirectConfig = allAllowedSlugs.length === 0 && !hasMeat && !hasSauce && !hasMenuOption;

  const cartTotal = getTotalCartPrice();

  const choiceTile = (selected: boolean) =>
    `rounded-lg p-3 text-center transition duration-200 active:scale-95 ${selected ? 'scale-[1.02] bg-pickle text-white' : 'bg-bun text-grill hover:bg-sesame'}`;

  const optionRow = (state: { selected: boolean; disabled?: boolean; outOfStock?: boolean }) =>
    `flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition duration-200 active:scale-[0.98] ${
      state.outOfStock
        ? 'pointer-events-none bg-bun opacity-40'
        : state.disabled
          ? 'cursor-not-allowed bg-bun opacity-50'
          : state.selected
            ? 'cursor-pointer bg-pickle-light'
            : 'cursor-pointer bg-bun hover:bg-sesame'
    }`;

  return (
    <>
      <SiteHeader
        action={
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Ouvrir le panier (${cartCount} article${cartCount > 1 ? 's' : ''})`}
            className="group btn btn-grill h-10 gap-2.5 pl-3 pr-2 text-sm"
          >
            <IconBag className="size-4 group-hover:animate-wiggle" />
            <span className="hidden sm:inline">Panier</span>
            <Bump value={cartCount} className="grid h-6 min-w-6 place-items-center rounded-md bg-cheddar px-1.5 text-xs font-black text-espresso tabular-nums">
              {cartCount}
            </Bump>
          </button>
        }
      />

      <main id="contenu" className={`flex-1 ${showCartBar ? 'pb-24 md:pb-0' : ''}`}>
        <PageIntro eyebrow="Commande en ligne" title="Notre carte & menus">
          Faites votre choix et personnalisez votre commande en un clic
        </PageIntro>

        {!loading && categories.length > 0 && (
          <div className="sticky top-[65px] z-30 animate-fade-in border-b border-sesame-dark bg-bun">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <ChipScroller label="Filtrer par catégorie" activeKey={activeCategoryFilter}>
                {[{ id: 'all', name: 'Tous les produits' }, ...categories].map((cat) => {
                  const active = activeCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryFilter(cat.id)}
                      aria-pressed={active}
                      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 active:scale-95 ${
                        active ? 'bg-grill text-bun' : 'bg-crumb text-grill hover:-translate-y-0.5 hover:bg-sesame'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </ChipScroller>
            </div>
          </div>
        )}

        <div key={activeCategoryFilter} className="mx-auto max-w-6xl animate-fade-in space-y-14 px-4 pb-24 pt-8 sm:px-6">
          {loading ? (
            <div role="status" aria-label="Chargement..." className="space-y-4">
              <div className="h-9 w-56 animate-pulse rounded-md bg-sesame" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-sesame/70" />
                ))}
              </div>
            </div>
          ) : (
            displayedCategories.map((catConfig) => {
              const catProducts = products.filter(p =>
                p.category_id ? p.category_id === catConfig.id : p.category?.toLowerCase().trim() === catConfig.name.toLowerCase().trim()
              );
              if (catProducts.length === 0) return null;
              const accentIndex = categories.findIndex(c => c.id === catConfig.id);

              return (
                <section key={catConfig.id} aria-labelledby={`cmd-cat-${catConfig.id}`} className="space-y-5">
                  <CategoryHeading id={`cmd-cat-${catConfig.id}`} name={catConfig.name} count={catProducts.length} accentIndex={accentIndex} />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {catProducts.map((article) => {
                      const opts = (article.allowed_options && article.allowed_options.length > 0) ? article.allowed_options : (catConfig.allowed_options || []);
                      const isCatDirect = opts.length === 0 && !article.has_menu;
                      return (
                        <article
                          key={article.id}
                          className={`group reveal flex flex-col rounded-xl bg-crumb p-5 ${article.inStock ? '' : 'opacity-60'}`}
                        >
                          <div className="flex gap-4">
                            {article.imageUrl && (
                              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-sesame">
                                <Image src={article.imageUrl} alt={article.name} fill sizes="80px" className="object-cover transition-transform duration-500 ease-snappy group-hover:scale-110 group-hover:-rotate-2" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-bold leading-snug">{article.name}</h3>
                                <PriceTag value={article.price} />
                              </div>
                              {!article.inStock && <div className="mt-2"><RuptureBadge /></div>}
                              {article.description && (
                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-grill-soft">{article.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-auto pt-5">
                            <button
                              type="button"
                              disabled={!article.inStock}
                              onClick={() => openConfigurator(article)}
                              className={`group/add flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold ${
                                article.inStock
                                  ? 'btn btn-ketchup'
                                  : 'cursor-not-allowed bg-sesame text-grill-soft'
                              }`}
                            >
                              {article.inStock ? (
                                <>
                                  <IconPlus className="size-4 transition-transform duration-300 ease-spring group-hover/add:rotate-90" />
                                  {isCatDirect ? "Ajouter au panier" : "Personnaliser & Ajouter"}
                                </>
                              ) : "Rupture de stock"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>

      <SiteFooter />

      {showCartBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 animate-rise border-t border-sesame-dark bg-bun px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-between rounded-xl bg-grill px-5 py-3.5 text-bun transition-transform active:scale-[0.98]"
          >
            <span className="flex items-center gap-3 text-sm font-bold">
              <Bump value={cartCount} className="grid h-6 min-w-6 place-items-center rounded-md bg-cheddar px-1.5 text-xs font-black text-espresso tabular-nums">
                {cartCount}
              </Bump>
              Voir le panier
            </span>
            <Bump value={cartTotal} className="inline-block font-display text-2xl leading-none tabular-nums">
              {cartTotal.toFixed(2)} €
            </Bump>
          </button>
        </div>
      )}

      {articleActif && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="config-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        >
          <div className="absolute inset-0 animate-fade-in bg-scrim/70" aria-hidden="true" />
          <div className="relative flex max-h-[92dvh] w-full max-w-lg animate-rise flex-col overflow-hidden rounded-t-2xl bg-crumb sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-sesame px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-grill-soft">
                  {currentCategoryConfig?.name ?? articleActif.category}
                </p>
                <h3 id="config-title" className="mt-1 font-display text-3xl uppercase leading-none">{articleActif.name}</h3>
                <p className="mt-2 text-sm font-semibold text-grill-soft">
                  Total estimé :{' '}
                  <Bump value={calculateUnitConfigPrice} className="inline-block text-pickle-ink tabular-nums">
                    {calculateUnitConfigPrice.toFixed(2)} €
                  </Bump>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setArticleActif(null)}
                aria-label="Fermer"
                className="group grid size-10 shrink-0 place-items-center rounded-lg bg-bun text-grill transition duration-200 hover:bg-sesame active:scale-90"
              >
                <IconX className="size-5 transition-transform duration-300 ease-spring group-hover:rotate-90" />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {articleActif.description && (
                <p className="text-sm leading-relaxed text-grill-soft">{articleActif.description}</p>
              )}
              {isDirectConfig ? (
                <div>
                  <OptionHeading title="Quantité" />
                  <div className="flex items-center justify-center gap-6 rounded-xl bg-bun py-5">
                    <StepButton size="lg" label="Retirer un article" onClick={() => setDirectQuantity(Math.max(1, directQuantity - 1))}>
                      <IconMinus className="size-5" />
                    </StepButton>
                    <Bump value={directQuantity} className="inline-block w-10 text-center font-display text-5xl leading-none tabular-nums">{directQuantity}</Bump>
                    <StepButton size="lg" label="Ajouter un article" onClick={() => setDirectQuantity(directQuantity + 1)}>
                      <IconPlus className="size-5" />
                    </StepButton>
                  </div>
                </div>
              ) : (
                <>
                  {hasMeat && (
                    <div className="space-y-6">
                      {isTacos && (
                        <div>
                          <OptionHeading title="Nombre de viandes" required />
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "1", label: "1 Viande", priceText: "Base" },
                              { id: "2", label: "2 Viandes", priceText: "+1.50 €" },
                              { id: "3", label: "3 Viandes", priceText: "+3.00 €" },
                            ].map(opt => {
                              const selected = nombreViandes === opt.id;
                              return (
                                <button key={opt.id} type="button" aria-pressed={selected} onClick={() => { setNombreViandes(opt.id); setSelectedViandes({}); if (opt.id !== "3") setNombreGalettes("1"); }} className={choiceTile(selected)}>
                                  <span className="block text-sm font-bold">{opt.label}</span>
                                  <span className={`block text-xs tabular-nums ${selected ? 'text-white/85' : 'text-grill-soft'}`}>{opt.priceText}</span>
                                </button>
                              );
                            })}
                          </div>
                          {nombreViandes === "3" && (
                            <div className="mt-5">
                              <OptionHeading title="Nombre de galettes" />
                              <div className="grid grid-cols-2 gap-2">
                                {[{ id: "1", label: "1 Galette", priceText: "Base" }, { id: "2", label: "2 Galettes", priceText: "+1.50 €" }].map(opt => {
                                  const selected = nombreGalettes === opt.id;
                                  return (
                                    <button key={opt.id} type="button" aria-pressed={selected} onClick={() => setNombreGalettes(opt.id)} className={choiceTile(selected)}>
                                      <span className="block text-sm font-bold">{opt.label}</span>
                                      <span className={`block text-xs tabular-nums ${selected ? 'text-white/85' : 'text-grill-soft'}`}>{opt.priceText}</span>
                                    </button>
                                  );
                                })}
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
                            <OptionHeading title="Sélection des viandes" required meta={`${currentMeatTotal}/${maxMeatLimit}`} />
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {listViandes.map(vObj => {
                                const count = selectedViandes[vObj.name] || 0;
                                const canAddMore = !isMeatMaxReached || count > 0;

                                return (
                                  <div
                                    key={vObj.id}
                                    className={`flex items-center justify-between gap-3 rounded-lg py-2 pl-3 pr-2 transition-colors ${
                                      !vObj.inStock ? 'bg-bun opacity-40' : count > 0 ? 'bg-pickle-light' : 'bg-bun'
                                    }`}
                                  >
                                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                      <span className="text-sm font-semibold">{vObj.name}</span>
                                      {!vObj.inStock && <RuptureBadge />}
                                      <ExtraPrice price={vObj.price} />
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                      <StepButton label={`Retirer ${vObj.name}`} disabled={!vObj.inStock || count <= 0} onClick={() => handleViandeCountChange(vObj.name, -1)}>
                                        <IconMinus className="size-4" />
                                      </StepButton>
                                      <Bump value={count} className="inline-block w-6 text-center text-sm font-bold tabular-nums">{count}</Bump>
                                      <StepButton label={`Ajouter ${vObj.name}`} disabled={!vObj.inStock || !canAddMore} onClick={() => handleViandeCountChange(vObj.name, 1)}>
                                        <IconPlus className="size-4" />
                                      </StepButton>
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
                      <div>
                        <OptionHeading title="Choix de la sauce" required={isRequired} meta={`${totalSaucesCount}/${maxSauceLimit}`} />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {listSauces.map(sObj => {
                            const isSelected = currentSauces.includes(sObj.name);
                            const isOutOfStock = !sObj.inStock;
                            const isDisabled = isOutOfStock || (!isSelected && maxSauceLimit > 0 && totalSaucesCount >= maxSauceLimit);

                            return (
                              <label key={sObj.id} className={optionRow({ selected: isSelected, disabled: isDisabled, outOfStock: isOutOfStock })}>
                                <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                                  <input
                                    type="checkbox"
                                    disabled={isDisabled}
                                    checked={isSelected}
                                    onChange={() => handleSauceCheckboxChange(sObj.name)}
                                    className="flat-check"
                                  />
                                  <span className="text-sm font-semibold">{sObj.name}</span>
                                  {isOutOfStock && <RuptureBadge />}
                                </span>
                                <ExtraPrice price={sObj.price} />
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
                    const limitsText = [minLimit > 0 ? `min ${minLimit}` : '', maxLimit ? `max ${maxLimit}` : ''].filter(Boolean).join(' · ');

                    return (
                      <div key={slug}>
                        <OptionHeading title={groupName} required={minLimit > 0} meta={limitsText || undefined} />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                                  aria-pressed={isSelected}
                                  onClick={() => handleDynamicCheckboxChange(slug, opt.name, true)}
                                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                                    isOutOfStock ? 'pointer-events-none bg-bun opacity-40' : isSelected ? 'bg-pickle text-white' : 'bg-bun text-grill hover:bg-sesame'
                                  }`}
                                >
                                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                    {isSelected && <IconCheck className="size-4 shrink-0" strokeWidth={3} />}
                                    <span className="text-sm font-semibold">{opt.name}</span>
                                    {isOutOfStock && <RuptureBadge />}
                                  </span>
                                  <ExtraPrice price={opt.price} inverted={isSelected} />
                                </button>
                              );
                            }

                            return (
                              <label key={opt.id} className={optionRow({ selected: isSelected, outOfStock: isDisabled })}>
                                <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                                  <input type="checkbox" disabled={isDisabled} checked={isSelected} onChange={() => handleDynamicCheckboxChange(slug, opt.name, false)} className="flat-check" />
                                  <span className="text-sm font-semibold">{opt.name}</span>
                                  {isOutOfStock && <RuptureBadge />}
                                </span>
                                <ExtraPrice price={opt.price} />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {hasMenuOption && (
                    <div className="rounded-xl bg-bun p-4">
                      <label className="flex cursor-pointer items-center justify-between gap-4">
                        <span className="flex items-center gap-3">
                          <span className={`grid size-10 shrink-0 place-items-center rounded-lg bg-cheddar text-espresso transition-transform duration-300 ease-spring ${isMenu ? '-rotate-12 scale-110' : ''}`}>
                            <IconCup className="size-5" />
                          </span>
                          <span>
                            <span className="block text-xs font-bold uppercase tracking-[0.12em]">
                              Passer en Menu
                              {articleActif?.menu_required && <RequiredMark />}
                            </span>
                            {Number(articleActif?.menu_price || 0) > 0 && (
                              <span className="mt-0.5 block text-sm font-bold text-pickle-ink tabular-nums">
                                +{Number(articleActif.menu_price).toFixed(2)} €
                              </span>
                            )}
                          </span>
                        </span>
                        <input type="checkbox" checked={isMenu} onChange={(e) => { setIsMenu(e.target.checked); if (!e.target.checked) setSelectedBoisson(""); }} className="flat-switch" />
                      </label>

                      {isMenu && (
                        <div className="mt-4 border-t border-sesame-dark pt-4">
                          <OptionHeading title="Choix de la boisson" required />
                          {boissonsData.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {boissonsData.map(boisson => {
                                const isOutOfStock = !boisson.inStock;
                                const isSelected = selectedBoisson === boisson.name;
                                return (
                                  <label
                                    key={boisson.id}
                                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-3 transition-colors ${
                                      isOutOfStock ? 'pointer-events-none bg-crumb opacity-40' : isSelected ? 'cursor-pointer bg-pickle-light' : 'cursor-pointer bg-crumb hover:bg-sesame'
                                    }`}
                                  >
                                    <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                                      <input type="radio" disabled={isOutOfStock} name="boissonChoice" checked={isSelected} onChange={() => setSelectedBoisson(boisson.name)} className="flat-check" />
                                      <span className="text-sm font-semibold">{boisson.name}</span>
                                      {isOutOfStock && <RuptureBadge />}
                                    </span>
                                    <ExtraPrice price={boisson.price} />
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-cheddar-ink">Aucune boisson disponible.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-sesame px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
              {isFormValid ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn btn-ketchup flex w-full animate-rise py-4 text-sm uppercase tracking-[0.06em]"
                >
                  <IconPlus className="size-4" />
                  Ajouter au panier ({calculateUnitConfigPrice.toFixed(2)} €)
                </button>
              ) : (
                <p className="flex items-center justify-center gap-2 py-2 text-center text-xs font-semibold text-grill-soft">
                  <IconInfo className="size-4 shrink-0" />
                  Veuillez compléter tous les choix obligatoires (marqués d&apos;un *) pour continuer.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 z-50 flex animate-fade-in justify-end bg-scrim/70">
          <aside
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="flex h-full w-full max-w-md animate-slide-in flex-col overflow-y-auto overscroll-contain bg-crumb"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-sesame bg-crumb px-6 py-5">
              <h3 id="cart-title" className="flex items-center gap-3 font-display text-3xl uppercase leading-none">
                Votre panier
                {cartCount > 0 && (
                  <Bump value={cartCount} className="grid h-6 min-w-6 place-items-center rounded-md bg-cheddar px-1.5 font-sans text-xs font-black text-espresso tabular-nums [font-stretch:100%]">
                    {cartCount}
                  </Bump>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Fermer le panier"
                className="group grid size-10 shrink-0 place-items-center rounded-lg bg-bun text-grill transition duration-200 hover:bg-sesame active:scale-90"
              >
                <IconX className="size-5 transition-transform duration-300 ease-spring group-hover:rotate-90" />
              </button>
            </div>

            <div className="flex-1 space-y-3 px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                  <span className="grid size-16 place-items-center rounded-2xl bg-bun text-grill-soft">
                    <IconBag className="size-8" />
                  </span>
                  <p className="text-base font-bold text-grill-soft">Votre panier est vide</p>
                </div>
              ) : (
                cart.map((item, index) => {
                  return (
                    <div
                      key={item.cartItemId}
                      className="animate-rise space-y-3 rounded-xl bg-bun p-4"
                      style={{ animationDelay: `${Math.min(index, 6) * 50 + 120}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold leading-snug">{item.name}</h4>
                        <span className="shrink-0 font-display text-xl leading-none tabular-nums">{item.finalPrice.toFixed(2)} €</span>
                      </div>

                      <div className="space-y-0.5 text-xs leading-relaxed text-grill-soft">
                        {!item.nombreViandes && !item.selectedSauce && (!item.dynamicSelections || Object.keys(item.dynamicSelections).length === 0) && !item.isMenu && (
                          <p className="italic">Article standard</p>
                        )}
                        {item.nombreViandes && (
                          <p>
                            <span className="font-semibold text-grill">Viandes ({item.nombreViandes}) :</span>{' '}
                            {Object.entries(item.selectedViandes || {}).map(([k, v]) => `${v}x ${k}`).join(', ')}
                          </p>
                        )}
                        {item.nombreGalettes && item.nombreGalettes !== "1" && (
                          <p><span className="font-semibold text-grill">Galettes :</span> {item.nombreGalettes} Galettes</p>
                        )}
                        {item.selectedSauce && (
                          <p><span className="font-semibold text-grill">Sauce :</span> {item.selectedSauce}</p>
                        )}
                        {item.dynamicSelections && Object.entries(item.dynamicSelections).map(([slug, values]) => {
                          if (!values || values.length === 0) return null;
                          const typeInfo = optionTypes.find(t => t.slug === slug);
                          return (
                            <p key={slug}>
                              <span className="font-semibold text-grill">{typeInfo?.name || slug} :</span> {values.join(', ')}
                            </p>
                          );
                        })}
                        {item.isMenu && (
                          <p className="flex items-center gap-1.5 pt-1 font-semibold text-pickle-ink">
                            <IconCup className="size-3.5" />
                            Menu {item.boisson ? `+ Boisson (${item.boisson})` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-sesame-dark/60 pt-3">
                        <div className="flex items-center gap-1">
                          <StepButton label={`Diminuer la quantité de ${item.name}`} onClick={() => updateCartItemQuantity(item.cartItemId, -1)}>
                            <IconMinus className="size-4" />
                          </StepButton>
                          <Bump value={item.quantity} className="inline-block w-7 text-center text-sm font-bold tabular-nums">{item.quantity}</Bump>
                          <StepButton label={`Augmenter la quantité de ${item.name}`} onClick={() => updateCartItemQuantity(item.cartItemId, 1)}>
                            <IconPlus className="size-4" />
                          </StepButton>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold text-ketchup-ink transition-colors hover:bg-ketchup-light"
                        >
                          <IconTrash className="size-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-5 border-t-2 border-dashed border-sesame-dark px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="order-note" className="text-xs font-bold uppercase tracking-[0.08em] text-grill-soft">Note pour la commande</label>
                    <span className={`text-xs font-bold tabular-nums ${orderNote.length >= 80 ? 'text-ketchup-ink' : 'text-grill-soft'}`}>{orderNote.length}/80</span>
                  </div>
                  <textarea id="order-note" placeholder="Ex: Sans oignons..." maxLength={80} rows={2} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} className={`${inputClass} resize-none`} />
                </div>

                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-bold uppercase tracking-[0.1em]">Total</span>
                  <Bump value={cartTotal} className="inline-block origin-right font-display text-4xl leading-none tabular-nums">{cartTotal.toFixed(2)} €</Bump>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-pickle-ink">Vos Coordonnées</h4>
                  <div>
                    <label htmlFor="customer-name" className={labelClass}>Prénom</label>
                    <input id="customer-name" type="text" autoComplete="given-name" placeholder="Votre prénom" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="customer-phone" className={labelClass}>Téléphone (10 chiffres)</label>
                    <input id="customer-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Ex : 0612345678" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={`${inputClass} tabular-nums`} />
                  </div>
                </div>

                {IS_DEMO && (
                  <p className="rounded-lg bg-cheddar-light px-4 py-3 text-xs leading-relaxed text-grill">
                    <strong>Mode démo :</strong> cette commande est simulée. Elle ne sera pas envoyée au restaurant et aucun paiement ne sera demandé.
                  </p>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleValidateOrder}
                  className="btn btn-ketchup flex w-full py-4 text-sm uppercase tracking-[0.06em] disabled:cursor-wait"
                >
                  {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                  {isSubmitting ? "Validation..." : IS_DEMO ? "Simuler la commande (démo)" : "Procéder au paiement"}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {orderSuccessModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 animate-fade-in bg-scrim/70" aria-hidden="true" />
          <div className="relative w-full max-w-sm animate-rise overflow-hidden rounded-2xl bg-crumb text-center">
            <div className="relative overflow-hidden bg-pickle px-6 pb-7 pt-8 text-white">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {CONFETTI.map((piece, i) => (
                  <span
                    key={i}
                    className="confetti"
                    style={{
                      background: piece.color,
                      borderRadius: piece.round ? '999px' : '2px',
                      '--x': piece.x,
                      '--y': piece.y,
                      '--r': piece.r,
                      '--d': piece.d,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
              <span className="relative mx-auto grid size-14 animate-pop place-items-center rounded-full bg-white text-pickle [animation-delay:120ms]">
                <IconCheck className="draw-check size-7" strokeWidth={3} />
              </span>
              <h3 id="success-title" className="relative mt-4 animate-rise font-display text-4xl uppercase leading-[0.95] [animation-delay:200ms]">
                {IS_DEMO ? "Commande simulée !" : "Merci pour votre commande !"}
              </h3>
            </div>
            <div className="space-y-5 p-6">
              <div className="animate-rise rounded-xl border-2 border-dashed border-sesame-dark bg-bun px-4 py-4 [animation-delay:320ms]">
                <p className="text-sm text-grill-soft">Votre numéro de commande est le</p>
                <p className="mt-1.5 font-display text-5xl uppercase leading-none tabular-nums">{orderSuccessModal.orderNumber}</p>
              </div>
              {IS_DEMO && (
                <p className="animate-rise text-xs leading-relaxed text-grill-soft [animation-delay:370ms]">
                  Ceci est une <strong className="text-grill">démonstration</strong> : rien n&apos;a été envoyé au restaurant. Le suivi fonctionne quand même, la commande passe « prête » au bout d&apos;une minute.
                </p>
              )}
              <div className="animate-rise space-y-2 [animation-delay:420ms]">
                <button
                  type="button"
                  onClick={() => router.push(`/suivi?order=${orderSuccessModal.orderNumber}`)}
                  className="btn btn-ketchup flex w-full py-3.5 text-sm uppercase tracking-[0.06em]"
                >
                  Suivre votre commande
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSuccessModal({ isOpen: false, orderNumber: '' })}
                  className="w-full rounded-lg bg-bun py-3 text-sm font-bold text-grill-soft transition duration-200 hover:bg-sesame active:scale-[0.98]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 ${showCartBar ? 'bottom-24 md:bottom-6' : 'bottom-6'}`}
        >
          <p className="flex animate-rise items-center gap-3 rounded-xl bg-grill py-2.5 pl-2.5 pr-5 text-sm font-semibold text-bun">
            <span className="grid size-7 animate-pop place-items-center rounded-lg bg-pickle text-white [animation-delay:120ms]">
              <IconCheck className="size-4" strokeWidth={3} />
            </span>
            {toast.text}
          </p>
        </div>
      )}
    </>
  );
}
