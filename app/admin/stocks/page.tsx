"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  upsertProductAction,
  deleteProductAction,
  toggleStockAction,
  toggleOptionStockAction,
  upsertOptionAction,
  deleteOptionAction,
  saveCategoryAction,
  deleteCategoryAction,
  updateCategoryPositionsAction,
  saveOptionTypeAction,
  deleteOptionTypeAction,
} from '@/app/actions/admin-stocks';
import { loginAction } from '@/app/actions/auth';

interface StockItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  category_id?: string | null;
  type?: string;
  price: number;
  imageUrl?: string;
  inStock: boolean;
  position?: number;
  has_menu?: boolean;
  menu_addon?: number | null;
  menu_required?: boolean;
  excluded_option_ids?: string[];
  group_overrides?: Record<string, { enabled: boolean; max_selectable: number; is_required: boolean }>;
}

interface CategoryConfig {
  id: string;
  name: string;
  available_as_menu: boolean;
  position?: number;
}

interface OptionTypeConfig {
  id: string;
  slug: string;
  name: string;
  max_selectable?: number;
  is_required?: boolean;
}

export default function AdminStocksPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'options' | 'categories'>('products');
  
  const [products, setProducts] = useState<StockItem[]>([]);
  const [options, setOptions] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [optionTypes, setOptionTypes] = useState<OptionTypeConfig[]>([]);
  const [optionCategoryTab, setOptionCategoryTab] = useState<string>('viande');

  const [selectedProductCategoryId, setSelectedProductCategoryId] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasMenu, setHasMenu] = useState<boolean>(false);
  const [menuAddon, setMenuAddon] = useState<string>('');
  const [menuRequired, setMenuRequired] = useState<boolean>(false);
  const [excludedOptionIds, setExcludedOptionIds] = useState<string[]>([]);
  const [groupOverrides, setGroupOverrides]  = useState<Record<string, { enabled: boolean; max_selectable: number; is_required: boolean }>>({});

  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optName, setOptName] = useState('');
  const [optType, setOptType] = useState('viande');
  const [optPrice, setOptPrice] = useState('0');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');

  const [isOptionTypeModalOpen, setIsOptionTypeModalOpen] = useState(false);
  const [editingOptionTypeId, setEditingOptionTypeId] = useState<string | null>(null);
  const [optTypeName, setOptTypeName] = useState('');

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

  const fetchData = async () => {
    const { data: prodData } = await supabase.from('products').select('*').order('name');
    const { data: typeDataFallback } = await supabase.from('option_types').select('*');
    
    let loadedOptionTypes: OptionTypeConfig[] = [];
    if (typeDataFallback && typeDataFallback.length > 0) {
      loadedOptionTypes = typeDataFallback.map((item: any) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        max_selectable: item.max_selectable ?? 1,
        is_required: item.is_required ?? false,
      }));
      setOptionTypes(loadedOptionTypes);
      if (!loadedOptionTypes.some(t => t.slug === optionCategoryTab)) {
        setOptionCategoryTab(loadedOptionTypes[0].slug);
      }
    }

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false })
      .order('name');
      
    let loadedCategories: CategoryConfig[] = [];
    if (categoriesData) {
      loadedCategories = categoriesData.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        available_as_menu: cat.available_as_menu ?? true,
        position: cat.position ?? 0,
      }));
      setCategories(loadedCategories);
    }

    if (prodData) {
      setProducts(prodData.map((item: any) => {
        const matchingCat = loadedCategories.find(c => c.id === item.category_id);
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          category: matchingCat ? matchingCat.name : (item.category || ''),
          category_id: item.category_id || null,
          price: Number(item.price),
          imageUrl: item.image_url || '',
          inStock: item.inStock ?? true,
          position: item.position ?? 0,
          has_menu: item.has_menu ?? false,
          menu_addon: item.menu_addon ?? null,
          menu_required: item.menu_required ?? false,
          excluded_option_ids: item.excluded_option_ids || [],
          group_overrides: item.group_overrides || {},
        };
      }));
    }

    const { data: optData } = await supabase.from('options').select('*').order('name', { ascending: true });
    if (optData) {
      setOptions(optData.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        price: Number(item.price || 0),
        inStock: item.inStock ?? true,
      })));
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const isKidsMenuProduct = (prodName: string, catId: string) => {
    const catObj = categories.find(c => c.id === catId);
    const combined = `${prodName} ${catObj?.name || ''}`.toLowerCase();
    return combined.includes('enfant') || combined.includes('kids');
  };

  const handleMenuChange = (checked: boolean, currentProdName = name, currentCatId = categoryId) => {
    setHasMenu(checked);
    if (!checked) {
      setMenuRequired(false);
    }
    const boissonType = optionTypes.find(t => {
      const text = (t.slug + ' ' + t.name).toLowerCase();
      return (text.includes('boisson') || text.includes('drink')) && !text.includes('boisson menu enfant');
    });

    if (boissonType) {
      const groupOptions = options.filter(o => o.type === boissonType.slug);
      const idsInGroup = groupOptions.map(o => o.id);
      const isKids = isKidsMenuProduct(currentProdName, currentCatId);

      if (!isKids) {
        setGroupOverrides(prev => ({
          ...prev,
          [boissonType.slug]: {
            enabled: checked,
            max_selectable: 1,
            is_required: false,
          }
        }));

        setExcludedOptionIds(prevExcluded => {
          if (checked) {
            return prevExcluded.filter(id => !idsInGroup.includes(id));
          } else {
            return Array.from(new Set([...prevExcluded, ...idsInGroup]));
          }
        });
      }
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;
    setCategories(newCategories);
    
    try {
      const updates = newCategories.map((cat, idx) => ({ id: cat.id, position: idx }));
      await updateCategoryPositionsAction(updates);
    } catch (err: any) {
      alert("Erreur de déplacement : " + err.message);
    }
  };

  const openOptionTypeModal = (typeObj?: OptionTypeConfig) => {
    if (typeObj) {
      setEditingOptionTypeId(typeObj.id);
      setOptTypeName(typeObj.name);
    } else {
      setEditingOptionTypeId(null);
      setOptTypeName('');
    }
    setIsOptionTypeModalOpen(true);
  };

  const handleSaveOptionType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optTypeName.trim()) return;
    const slug = optTypeName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_");
    try {
      await saveOptionTypeAction({ slug, name: optTypeName }, editingOptionTypeId);
      setOptTypeName('');
      setEditingOptionTypeId(null);
      setIsOptionTypeModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  const deleteOptionType = async (slug: string, name: string) => {
    if (confirm(`Supprimer la catégorie d'option "${name}" et toutes ses options associées ?`)) {
      try {
        await deleteOptionTypeAction(slug);
        fetchData();
      } catch (err: any) {
        alert("Erreur : " + err.message);
      }
    }
  };

  const openCategoryModal = (cat?: CategoryConfig) => {
    if (cat) {
      setEditingCategoryId(cat.id);
      setCatName(cat.name);
    } else {
      setEditingCategoryId(null);
      setCatName('');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      const existingCat = categories.find(c => c.id === editingCategoryId);
      const targetPosition = existingCat?.position ?? categories.length;

      await saveCategoryAction({ 
        name: catName, 
        available_as_menu: true, 
        position: targetPosition 
      }, editingCategoryId);
      
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (confirm(`Supprimer la catégorie "${name}" et ses produits associés ?`)) {
      try {
        await deleteCategoryAction(id);
        fetchData();
      } catch (err: any) {
        alert("Erreur : " + err.message);
      }
    }
  };

  const toggleStock = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: newStatus } : p));
    try {
      await toggleStockAction(id, newStatus);
    } catch (err: any) {
      alert("Erreur : " + err.message);
      fetchData();
    }
  };

  const toggleOptionStock = async (id: string, currentStatus: boolean) => {
    const newStockStatus = !currentStatus;
    setOptions(prev => prev.map(o => o.id === id ? { ...o, inStock: newStockStatus } : o));
    try {
      await toggleOptionStockAction(id, newStockStatus);
      fetchData();
    } catch (err: any) {
      alert("Erreur : " + err.message);
      fetchData();
    }
  };
  
  const deleteProduct = async (id: string) => {
    if (confirm("Supprimer ce produit ?")) {
      try {
        await deleteProductAction(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        alert("Erreur : " + err.message);
      }
    }
  };

  const deleteOption = async (id: string) => {
    if (confirm("Supprimer cette option ?")) {
      try {
        await deleteOptionAction(id);
        fetchData();
      } catch (err: any) {
        alert("Erreur : " + err.message);
      }
    }
  };

  const openModal = (product?: StockItem) => {
    const currentName = product ? product.name : name;
    const currentCatId = product ? (product.category_id || '') : categoryId;
    const isKids = isKidsMenuProduct(currentName, currentCatId);

    if (product) {
      setEditingId(product.id);
      setName(product.name);
      setDescription(product.description || '');
      setCategoryId(product.category_id || categories[0]?.id || '');
      setPrice(product.price.toString());
      setImageUrl(product.imageUrl || '');
      setHasMenu(product.has_menu ?? false);
      setMenuAddon(product.menu_addon !== null && product.menu_addon !== undefined ? product.menu_addon.toString() : '');
      setMenuRequired(product.menu_required ?? false);
      
      const currentExcluded = product.excluded_option_ids || [];
      setExcludedOptionIds(currentExcluded);
      
      const initialOverrides: Record<string, { enabled: boolean; max_selectable: number; is_required: boolean }> = {};
      optionTypes.forEach(t => {
        const existing = product.group_overrides?.[t.slug];
        const groupOptions = options.filter(o => o.type === t.slug);
        const hasNonExcludedOpt = groupOptions.some(o => !currentExcluded.includes(o.id));
        const text = (t.slug + ' ' + t.name).toLowerCase();
        const isKidsGroup = text.includes('menu enfant') || text.includes('dessert menu') || text.includes('boisson menu enfant') || text.includes('kids');
        const isKidsDrinkGroup = text.includes('boisson menu enfant');
        const isBoisson = (text.includes('boisson') || text.includes('drink')) && !isKidsDrinkGroup;

        const isEnabled = (!isKids && isKidsGroup) ? false : (existing ? existing.enabled : (groupOptions.length > 0 && hasNonExcludedOpt));

        initialOverrides[t.slug] = {
          enabled: isEnabled,
          max_selectable: existing?.max_selectable ?? t.max_selectable ?? 1,
          is_required: isBoisson ? false : (existing?.is_required ?? false),
        };
      });
      setGroupOverrides(initialOverrides);
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      const defaultCatId = selectedProductCategoryId !== 'all' ? selectedProductCategoryId : (categories[0]?.id || '');
      setCategoryId(defaultCatId);
      setPrice('');
      setImageUrl('');
      setHasMenu(false);
      setMenuAddon('');
      setMenuRequired(false);
      setExcludedOptionIds([]);
      
      const initialOverrides: Record<string, { enabled: boolean; max_selectable: number; is_required: boolean }> = {};
      optionTypes.forEach(t => {
        const text = (t.slug + ' ' + t.name).toLowerCase();
        const isKidsGroup = text.includes('menu enfant') || text.includes('dessert menu') || text.includes('boisson menu enfant') || text.includes('kids');
        const isKidsDrinkGroup = text.includes('boisson menu enfant');
        const isBoisson = (text.includes('boisson') || text.includes('drink')) && !isKidsDrinkGroup;

        initialOverrides[t.slug] = {
          enabled: !isKids && isKidsGroup ? false : false,
          max_selectable: t.max_selectable ?? 1,
          is_required: isBoisson ? false : false,
        };
      });
      setGroupOverrides(initialOverrides);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openOptionModal = (option?: StockItem) => {
    if (option) {
      setEditingOptionId(option.id);
      setOptName(option.name);
      setOptType(option.type || optionCategoryTab);
      setOptPrice(option.price.toString());
    } else {
      setEditingOptionId(null);
      setOptName('');
      setOptType(optionCategoryTab);
      setOptPrice('0');
    }
    setIsOptionModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setUploading(true);
    let finalImageUrl = imageUrl;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        await supabase.storage.from('products').upload(fileName, imageFile);
        const { data: publicURLData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicURLData.publicUrl;
      }

      const numericPrice = parseFloat(price);
      const numericMenuAddon = menuAddon.trim() === '' ? null : parseFloat(menuAddon);
      const selectedCatObj = categories.find(c => c.id === categoryId);
      const finalCategoryName = selectedCatObj ? selectedCatObj.name : '';

      let finalExcluded = [...excludedOptionIds];
      Object.entries(groupOverrides).forEach(([slug, conf]) => {
        const groupOpts = options.filter(o => o.type === slug);
        if (!conf.enabled) {
          groupOpts.forEach(o => {
            if (!finalExcluded.includes(o.id)) finalExcluded.push(o.id);
          });
        }
      });

      const productPayload = { 
        name, 
        description, 
        category: finalCategoryName,
        category_id: categoryId || null, 
        price: numericPrice, 
        image_url: finalImageUrl,
        has_menu: hasMenu,
        menu_addon: numericMenuAddon,
        menu_required: hasMenu ? menuRequired : false,
        excluded_option_ids: Array.from(new Set(finalExcluded)),
        group_overrides: groupOverrides
      };

      await upsertProductAction(productPayload, editingId);

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Erreur : " + (err?.message || JSON.stringify(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optName) return;
    const numericPrice = optPrice === '' ? 0 : (parseFloat(optPrice) || 0);

    try {
      await upsertOptionAction({ name: optName, type: optType, price: numericPrice }, editingOptionId);
      setIsOptionModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <h1 className="text-xl font-black uppercase text-white">Espace Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Mot de passe..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-center focus:outline-none focus:border-orange-500"
              required
            />
            {error && <p className="text-xs text-rose-500 font-bold">Mot de passe incorrect.</p>}
            <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-2xl text-sm">Se connecter</button>
          </form>
        </div>
      </main>
    );
  }

  const filteredOptions = options.filter(o => o.type === optionCategoryTab);
  const filteredProducts = selectedProductCategoryId === 'all' 
    ? products 
    : products.filter(p => p.category_id === selectedProductCategoryId);

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 relative">
      <header className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-black uppercase tracking-tight">Admin — <span className="text-orange-500">Gestion des Stocks</span></h1>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold">📃 Commandes</Link>
          <Link href="/" className="bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold">← Accueil</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex gap-3 border-b border-neutral-800 pb-4 overflow-x-auto">
          <button onClick={() => setActiveTab('products')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${activeTab === 'products' ? 'bg-orange-500 text-white' : 'bg-neutral-900 text-neutral-400'}`}>
            🍔 Produits ({products.length})
          </button>
          <button onClick={() => setActiveTab('options')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${activeTab === 'options' ? 'bg-orange-500 text-white' : 'bg-neutral-900 text-neutral-400'}`}>
            🥤 Options ({options.length})
          </button>
          <button onClick={() => setActiveTab('categories')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${activeTab === 'categories' ? 'bg-orange-500 text-white' : 'bg-neutral-900 text-neutral-400'}`}>
            📁 Catégories ({categories.length})
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-xs text-neutral-400">Gérez vos produits principaux.</p>
              <button onClick={() => openModal()} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Créer un produit</button>
            </div>

            <div className="flex flex-wrap gap-2 bg-neutral-900 p-2 rounded-2xl border border-neutral-800 items-center">
              <button 
                onClick={() => setSelectedProductCategoryId('all')} 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedProductCategoryId === 'all' ? 'bg-orange-500 text-white' : 'bg-neutral-950 text-neutral-400 hover:text-white'}`}
              >
                Toutes ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter(p => p.category_id === cat.id).length;
                return (
                  <button 
                    key={cat.id} 
                    onClick={() => setSelectedProductCategoryId(cat.id)} 
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedProductCategoryId === cat.id ? 'bg-orange-500 text-white' : 'bg-neutral-950 text-neutral-400 hover:text-white'}`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              {filteredProducts.length === 0 ? (
                <p className="p-6 text-xs text-neutral-500 text-center">Aucun produit dans cette catégorie.</p>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-4 border-b border-neutral-800 last:border-none">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 flex-shrink-0 border border-neutral-800">
                          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-sm">{product.name} - <span className="text-orange-500">{product.price.toFixed(2)} €</span></h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] bg-neutral-800 text-orange-400 px-2 py-0.5 rounded">{product.category}</span>
                          {!product.has_menu ? (
                            <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">Pas de menu</span>
                          ) : (
                            <span className="text-[10px] bg-neutral-800 text-emerald-400 px-2 py-0.5 rounded">
                              Menu +{Number(product.menu_addon ?? 0).toFixed(2)}€ {product.menu_required ? '(Requis)' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleStock(product.id, product.inStock)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${product.inStock ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {product.inStock ? 'En stock' : 'Hors stock'}
                      </button>
                      <button onClick={() => openModal(product)} className="bg-neutral-800 px-3 py-1.5 rounded-xl text-xs">✏️</button>
                      <button onClick={() => deleteProduct(product.id)} className="bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-xl text-xs">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'options' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-neutral-400">Gérez les options et suppléments.</p>
              <div className="flex gap-2">
                <button onClick={() => openOptionTypeModal()} className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-xl text-xs font-bold">+ Créer un onglet</button>
                <button onClick={() => openOptionModal()} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Ajouter une option</button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 bg-neutral-900 p-2 rounded-2xl border border-neutral-800 items-center">
              {optionTypes.map((type) => (
                <div key={type.slug} className="flex items-center gap-1 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
                  <button onClick={() => setOptionCategoryTab(type.slug)} className={`xs font-bold ${optionCategoryTab === type.slug ? 'text-orange-500' : 'text-neutral-400'}`}>
                    {type.name}
                  </button>
                  <button onClick={() => openOptionTypeModal(type)} className="text-neutral-400 hover:text-white text-xs px-1">✏️</button>
                  {optionTypes.length > 1 && (
                    <button onClick={() => deleteOptionType(type.slug, type.name)} className="text-rose-400 hover:text-rose-300 text-[10px] px-1">✕</button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              {filteredOptions.length === 0 ? (
                <p className="p-4 text-xs text-neutral-500 text-center">Aucune option dans cette section.</p>
              ) : (
                filteredOptions.map(opt => (
                  <div key={opt.id} className="flex justify-between items-center p-4 border-b border-neutral-800 last:border-none">
                    <div>
                      <h3 className="font-bold text-sm text-white">{opt.name} (+{opt.price.toFixed(2)} €)</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleOptionStock(opt.id, opt.inStock)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${opt.inStock ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {opt.inStock ? 'En stock' : 'Hors stock'}
                      </button>
                      <button onClick={() => openOptionModal(opt)} className="bg-neutral-800 px-3 py-1.5 rounded-xl text-xs">✏️</button>
                      <button onClick={() => deleteOption(opt.id)} className="bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-xl text-xs">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-neutral-400">Gérez le nom, l&apos;ordre et l&apos;option menu des catégories.</p>
              <button onClick={() => openCategoryModal()} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Créer une catégorie</button>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              {categories.map((cat, index) => (
                <div key={cat.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-neutral-800 last:border-none gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{cat.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {cat.available_as_menu && <span className="text-[10px] bg-neutral-800 text-emerald-400 px-2 py-0.5 rounded border border-neutral-700">🍟 Option Menu activée</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => moveCategory(index, 'up')} className="bg-neutral-800 px-2.5 py-1.5 rounded-xl text-xs font-bold">⬆️</button>
                    <button onClick={() => moveCategory(index, 'down')} className="bg-neutral-800 px-2.5 py-1.5 rounded-xl text-xs font-bold">⬇️</button>
                    <button onClick={() => openCategoryModal(cat)} className="bg-neutral-800 px-3 py-1.5 rounded-xl text-xs font-bold">✏️ Modifier</button>
                    <button onClick={() => deleteCategory(cat.id, cat.name)} className="bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-xl text-xs font-bold">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isOptionTypeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              {editingOptionTypeId ? "Modifier l'onglet d'option" : "Ajouter un onglet d'option"}
            </h3>
            <form onSubmit={handleSaveOptionType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Nom du groupe</label>
                <input 
                  type="text" 
                  value={optTypeName} 
                  onChange={(e) => setOptTypeName(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500" 
                  required 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsOptionTypeModalOpen(false)} className="bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold">Annuler</button>
                <button type="submit" className="bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">{editingCategoryId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Nom de la catégorie</label>
                <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500" required />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold">Annuler</button>
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">{editingId ? 'Modifier le produit' : 'Nouveau produit'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Nom</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Catégorie</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500">
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 resize-none h-16" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Tarif seul (€)</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800 items-center">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasMenu} 
                      onChange={(e) => handleMenuChange(e.target.checked)} 
                      className="accent-orange-500 w-4 h-4 rounded" 
                    />
                    <span className="text-xs font-bold text-white uppercase">Proposer ce produit en menu</span>
                  </label>

                  {hasMenu && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-300 font-medium">
                      <input 
                        type="checkbox"
                        checked={menuRequired}
                        onChange={(e) => setMenuRequired(e.target.checked)}
                        className="accent-orange-500 w-3.5 h-3.5 rounded"
                      />
                      <span className="text-orange-400 font-bold">Requis</span>
                    </label>
                  )}
                </div>

                {hasMenu && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">Supplément menu personnalisé (€)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Ex: 3.00 ou vide"
                      value={menuAddon} 
                      onChange={(e) => setMenuAddon(e.target.value)} 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                )}
              </div>

              {optionTypes.length > 0 && (
                <div className="pt-2 border-t border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">Activer et configurer les onglets d&apos;options :</label>
                    <button
                      type="button"
                      onClick={() => {
                        const resetOverrides: Record<string, { enabled: boolean; max_selectable: number; is_required: boolean }> = {};
                        const allGroupOptionIds: string[] = [];
                        optionTypes.forEach(t => {
                          const text = (t.slug + ' ' + t.name).toLowerCase();
                          const isKidsDrinkGroup = text.includes('boisson menu enfant');
                          const isBoisson = (text.includes('boisson') || text.includes('drink')) && !isKidsDrinkGroup;
                          resetOverrides[t.slug] = {
                            enabled: false,
                            max_selectable: t.max_selectable ?? 1,
                            is_required: isBoisson ? false : false,
                          };
                          options.filter(o => o.type === t.slug).forEach(o => allGroupOptionIds.push(o.id));
                        });
                        setGroupOverrides(resetOverrides);
                        setExcludedOptionIds(Array.from(new Set([...excludedOptionIds, ...allGroupOptionIds])));
                        setHasMenu(false);
                        setMenuRequired(false);
                      }}
                      className="text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-lg font-bold transition"
                    >
                      Tout décocher
                    </button>
                  </div>

                  {(() => {
                    const isKids = isKidsMenuProduct(name, categoryId);
                    const classifyType = (t: OptionTypeConfig) => {
                      const text = (t.slug + ' ' + t.name).toLowerCase();
                      if (
                        text.includes('menu enfant') || 
                        text.includes('dessert menu') || 
                        text.includes('boisson menu enfant') ||
                        text.includes('kids')
                      ) {
                        return 'autre';
                      }
                      if (text.includes('boisson') || text.includes('drink')) return 'boisson';
                      if (text.includes('crudit') || text.includes('retir') || text.includes('sans')) return 'crudite';
                      if (text.includes('supp') || text.includes('extra')) return 'supplement';
                      return 'principal';
                    };

                    const sections = {
                      principal: optionTypes.filter(t => classifyType(t) === 'principal'),
                      crudite: optionTypes.filter(t => classifyType(t) === 'crudite'),
                      supplement: optionTypes.filter(t => classifyType(t) === 'supplement'),
                      boisson: optionTypes.filter(t => classifyType(t) === 'boisson'),
                    };

                    const classifiedSlugs = new Set([
                      ...sections.principal.map(t => t.slug),
                      ...sections.crudite.map(t => t.slug),
                      ...sections.supplement.map(t => t.slug),
                      ...sections.boisson.map(t => t.slug),
                    ]);
                    
                    const finalSections = {
                      ...sections,
                      autre: optionTypes.filter(t => {
                        const text = (t.slug + ' ' + t.name).toLowerCase();
                        const isForcedOther = text.includes('menu enfant') || text.includes('dessert menu') || text.includes('boisson menu enfant');
                        return isForcedOther || !classifiedSlugs.has(t.slug);
                      }),
                    };

                    const renderGroupCard = (typeObj: OptionTypeConfig) => {
                      const groupOptions = options.filter(o => o.type === typeObj.slug);
                      if (groupOptions.length === 0) return null;

                      const text = (typeObj.slug + ' ' + typeObj.name).toLowerCase();
                      const isKidsDrinkGroup = text.includes('boisson menu enfant');
                      const isBoisson = (text.includes('boisson') || text.includes('drink')) && !isKidsDrinkGroup;

                      const override = groupOverrides[typeObj.slug] || {
                        enabled: false,
                        max_selectable: typeObj.max_selectable ?? 1,
                        is_required: isBoisson ? false : false,
                      };

                      const groupIsEnabled = isBoisson && !isKids ? hasMenu : override.enabled;

                      return (
                        <div key={typeObj.slug} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={groupIsEnabled} 
                                disabled={isBoisson && !isKids}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setGroupOverrides(prev => ({
                                    ...prev,
                                    [typeObj.slug]: { ...override, enabled: checked }
                                  }));
                                  const idsInGroup = groupOptions.map(o => o.id);
                                  if (checked) {
                                    setExcludedOptionIds(excludedOptionIds.filter(id => !idsInGroup.includes(id)));
                                  } else {
                                    setExcludedOptionIds(Array.from(new Set([...excludedOptionIds, ...idsInGroup])));
                                  }
                                }}
                                className="accent-orange-500 w-4 h-4 rounded" 
                              />
                              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{typeObj.name}</span>
                            </label>

                            {groupIsEnabled && (
                              <div className="flex items-center gap-4 text-xs">
                                <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 font-medium">
                                  <input 
                                    type="checkbox"
                                    checked={override.is_required}
                                    onChange={(e) => {
                                      setGroupOverrides(prev => ({
                                        ...prev,
                                        [typeObj.slug]: { ...override, is_required: e.target.checked }
                                      }));
                                    }}
                                    className="accent-orange-500 w-3.5 h-3.5 rounded"
                                  />
                                  <span>Requis</span>
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-neutral-400">Max :</span>
                                  <input 
                                    type="number"
                                    min="1"
                                    value={override.max_selectable}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      setGroupOverrides(prev => ({
                                        ...prev,
                                        [typeObj.slug]: { ...override, max_selectable: val }
                                      }));
                                    }}
                                    className="w-16 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                              </div>
                            )}

                            {isBoisson && !isKids && (
                              <span className="text-[10px] text-neutral-500 italic">Synchronisé avec &quot;En menu&quot;</span>
                            )}
                          </div>

                          {groupIsEnabled && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                              {groupOptions.map(opt => {
                                const isExcluded = excludedOptionIds.includes(opt.id);
                                const isAuthorized = !isExcluded;
                                return (
                                  <label key={opt.id} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                                    <input 
                                      type="checkbox" 
                                      checked={isAuthorized} 
                                      disabled={isBoisson && !isKids}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setExcludedOptionIds(excludedOptionIds.filter(id => id !== opt.id));
                                        } else {
                                          setExcludedOptionIds([...excludedOptionIds, opt.id]);
                                        }
                                      }}
                                      className="accent-orange-500 w-3.5 h-3.5 rounded" 
                                    />
                                    <span className="truncate">{opt.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 max-h-80 overflow-y-auto">
                        {finalSections.principal.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider block">📌 Options principales</span>
                            {finalSections.principal.map(renderGroupCard)}
                          </div>
                        )}
                        {finalSections.crudite.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-neutral-800">
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">🥗 Crudité à retirer (en supplément ou non)</span>
                            {finalSections.crudite.map(renderGroupCard)}
                          </div>
                        )}
                        {finalSections.supplement.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-neutral-800">
                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block">➕ Options supplément</span>
                            {finalSections.supplement.map(renderGroupCard)}
                          </div>
                        )}
                        <div className="space-y-2 pt-2 border-t border-neutral-800">
                          <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider block">⚙️ Autres options</span>
                          {finalSections.autre.length > 0 ? (
                            finalSections.autre.map(renderGroupCard)
                          ) : (
                            <p className="text-[11px] text-neutral-500 italic py-1">Aucune autre option</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Image du produit</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => e.target.files && setImageFile(e.target.files[0])} 
                  className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold">Annuler</button>
                <button type="submit" disabled={uploading} className="bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold">
                  {uploading ? 'Chargement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOptionModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">{editingOptionId ? 'Modifier l’option' : 'Ajouter une option'}</h3>
            <form onSubmit={handleSaveOption} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Nom</label>
                <input type="text" value={optName} onChange={(e) => setOptName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Type / Onglet</label>
                <select value={optType} onChange={(e) => setOptType(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500">
                  {optionTypes.map((type) => (
                    <option key={type.slug} value={type.slug}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Prix additionnel (€)</label>
                <input 
                  type="number" 
                  step="0.10" 
                  min="0"
                  placeholder="0"
                  value={optPrice} 
                  onChange={(e) => setOptPrice(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsOptionModalOpen(false)} className="bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold">Annuler</button>
                <button type="submit" className="bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}