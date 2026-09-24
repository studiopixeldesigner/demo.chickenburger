"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { withBasePath } from '@/lib/base-path';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl?: string;
  inStock: boolean;
}

interface FallingEmoji {
  id: number;
  emoji: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

export default function MenuPage() {
  const [emojis, setEmojis] = useState<FallingEmoji[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const list = ['🍔', '🌮', '🍟', '🥤', '🍗', '🍚'];
    const generated: FallingEmoji[] = [];
    for (let i = 0; i < 25; i++) {
      generated.push({
        id: i,
        emoji: list[Math.floor(Math.random() * list.length)],
        left: Math.random() * 100,
        size: Math.random() * 2.5 + 1,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 5,
      });
    }
    setEmojis(generated);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*, categories(name)');

        if (prodError) {
          console.error("Erreur lors du chargement du menu :", prodError.message);
        }

        let formattedProducts: Product[] = [];
        if (prodData) {
          formattedProducts = prodData.map((item: any) => {
            const stockValue = item.inStock ?? item.instock ?? item.in_stock ?? true;
            return {
              id: item.id,
              name: item.name,
              description: item.description || '',
              category: (item.categories as { name?: string })?.name || item.category || 'Autres',
              price: Number(item.price),
              imageUrl: item.image_url || item.imageUrl || '',
              inStock: Boolean(stockValue),
            };
          });
          setProducts(formattedProducts);
        }

        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('name')
          .order('position', { ascending: true, nullsFirst: false })
          .order('name');

        const productCategories = Array.from(new Set(formattedProducts.map(p => p.category)));

        if (!catError && catData && catData.length > 0) {
          const orderedCatNames = catData.map((c: any) => c.name);
          const merged = [
            ...orderedCatNames.filter(cat => productCategories.includes(cat)),
            ...productCategories.filter(cat => !orderedCatNames.includes(cat))
          ];
          setCategories(merged.length > 0 ? merged : productCategories);
        } else {
          setCategories(productCategories);
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#40342C] text-[#FAF6F0] selection:bg-emerald-500 selection:text-white flex flex-col justify-between relative overflow-hidden">
      
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.15; }
          90% { opacity: 0.15; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
        .falling-item { position: absolute; top: -50px; animation: fall linear infinite; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {emojis.map((item) => (
          <span
            key={item.id}
            className="falling-item select-none"
            style={{
              left: `${item.left}%`,
              fontSize: `${item.size}rem`,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        <div>
          <header className="bg-[#372D26]/90 backdrop-blur-md border-b border-[#59493E] p-4 sticky top-0 z-40 flex justify-between items-center px-6 shadow-md">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 transform group-hover:scale-110 transition duration-300">
                <Image src={withBasePath('/logo.png')} alt="Chicken Burger Logo" fill className="object-cover" />
              </div>
              <span className="font-black text-lg tracking-tighter text-white">
                CHICKEN <span className="text-orange-400">BURGER</span>
              </span>
            </Link>

            <Link 
              href="/" 
              className="bg-[#4E3F35] hover:bg-[#5E4C40] text-white px-4 py-2 rounded-full font-bold text-xs border border-[#6B5749] transition duration-300 shadow-md"
            >
              ← Retour à l'accueil
            </Link>
          </header>

          <section className="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
            <span className="inline-block bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-sm backdrop-blur-md">
              🍽️ Notre Carte
            </span>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 mb-4 drop-shadow-md">
              Découvrez nos délices
            </h1>
            <p className="text-[#F5F0E8] text-sm sm:text-base max-w-xl mx-auto font-medium">
              Des produits frais, des viandes origine France, Pologne, Allemagne (certifiées Halal) et des sauces maison pour le plus grand plaisir des gourmands.
            </p>
          </section>

          <div className="max-w-5xl mx-auto px-6 space-y-16 pb-16">
            {loading ? (
              <div className="text-center py-20 text-emerald-400 font-bold">Chargement du menu en cours...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-[#CBC0B4] font-bold">Aucun produit disponible pour le moment. Revenez vite !</div>
            ) : (
              categories.map((category) => {
                const categoryProducts = products.filter((p) => p.category === category);
                if (categoryProducts.length === 0) return null;

                return (
                  <div key={category}>
                    <h2 className="text-2xl font-black uppercase tracking-wider text-emerald-400 mb-6 border-b border-[#59493E] pb-3 flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/30"></span>
                      <span>{category}</span>
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                      {categoryProducts.map((product) => (
                        <div 
                          key={product.id}
                          className={`bg-[#372D26]/90 backdrop-blur-sm border border-[#59493E] p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/50 transition duration-300 shadow-xl relative overflow-hidden group ${!product.inStock ? 'opacity-80' : ''}`}
                        >
                          {product.imageUrl && (
                            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none transform group-hover:scale-105 transition duration-500">
                              <Image 
                                src={product.imageUrl} 
                                alt={product.name} 
                                fill 
                                className="object-cover" 
                              />
                            </div>
                          )}

                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg text-white">{product.name}</h3>
                              <span className="text-emerald-400 font-black text-base bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{product.price.toFixed(2)} €</span>
                            </div>
                            <p className="text-[#CBC0B4] text-xs leading-relaxed mb-4 font-medium">
                              {product.description}
                            </p>
                          </div>

                          <div className="relative z-10 mt-2 flex items-center justify-between">
                            <div className="flex gap-2">
                              <span className="text-[10px] bg-[#4E3F35] border border-[#6B5749] text-emerald-300 px-2.5 py-1 rounded-md w-fit font-semibold inline-block shadow-sm">
                                Fait maison
                              </span>
                              {!product.inStock && (
                                <span className="text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2.5 py-1 rounded-md font-semibold inline-block shadow-sm">
                                  Indisponible
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
                <p>
                  <strong className="text-white">Adresse : </strong>
                  <a href="https://www.google.com/maps/search/?api=1&query=34+Rue+de+la+Gare,+70200+Lure" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline hover:text-emerald-300 transition">
                    34 Rue de la Gare, 70200 Lure
                  </a>
                </p>
                <p>
                  <strong className="text-white">Téléphone : </strong>
                  <a href="tel:0363751530" className="text-emerald-400 hover:underline hover:text-emerald-300 transition">
                    03 63 75 15 30
                  </a>
                </p>
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
                <iframe 
                  title="Carte 34 Rue de la Gare Lure"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2728.895316335193!2d6.4912!3d47.6845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47923a1820b33b9f%3A0x6b8a8b13c1234567!2s34+Rue+de+la+Gare%2C+70200+Lure!5e0!3m2!1sfr!2sfr!4v1650000000000!5m2!1sfr!2sfr" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 border-t border-[#59493E] pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-[#B8ABA0]">
            <p>© 2026 Chicken Burger Lure. Tous droits réservés.</p>
            <p className="mt-2 sm:mt-0">
              <a href="https://www.google.com/maps/search/?api=1&query=34+Rue+de+la+Gare,+70200+Lure" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">34 Rue de la Gare, 70200 Lure</a> — Tél : <a href="tel:0363751530" className="hover:text-white transition">03 63 75 15 30</a>
            </p>
            <p className="mt-1">
              Powered by <a href="https://studiopixeldesigner.github.io/pixeldesigner" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline font-semibold transition">Pixel Designer</a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}