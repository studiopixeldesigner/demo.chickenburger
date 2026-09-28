"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SiteHeader from '@/app/_components/SiteHeader';
import SiteFooter from '@/app/_components/SiteFooter';
import { CategoryHeading, PageIntro, PriceTag, slugify } from '@/app/_components/ui';
import { IconArrowRight, IconBurger } from '@/app/_components/icons';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl?: string;
  inStock: boolean;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const visibleCategories = categories.filter(category => products.some(p => p.category === category));

  return (
    <>
      <SiteHeader />

      <main id="contenu" className="flex-1">
        <PageIntro
          eyebrow="Notre carte"
          title="Découvrez nos délices"
          accent="bg-pickle"
          actions={
            <Link
              href="/commander"
              className="group btn btn-ketchup gap-3 px-6 py-3.5 text-sm uppercase tracking-[0.08em]"
            >
              Commander en ligne
              <IconArrowRight className="size-5 transition-transform duration-300 ease-spring group-hover:translate-x-1.5" />
            </Link>
          }
        >
          Des produits frais, des viandes origine France, Pologne, Allemagne (certifiées Halal) et des sauces maison pour le plus grand plaisir des gourmands.
        </PageIntro>

        {!loading && visibleCategories.length > 1 && (
          <nav aria-label="Catégories de la carte" className="mx-auto max-w-6xl animate-fade-in px-4 pb-4 sm:px-6">
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {visibleCategories.map((category) => (
                <li key={category} className="shrink-0">
                  <a
                    href={`#cat-${slugify(category)}`}
                    className="block rounded-lg bg-crumb px-4 py-2 text-sm font-semibold text-grill transition duration-200 hover:-translate-y-0.5 hover:bg-sesame active:scale-95"
                  >
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mx-auto max-w-6xl space-y-14 px-4 pb-24 pt-8 sm:px-6">
          {loading ? (
            <div role="status" aria-label="Chargement du menu en cours..." className="space-y-4">
              <div className="h-9 w-56 animate-pulse rounded-md bg-sesame" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-xl bg-sesame/70" />
                ))}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-crumb px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-xl bg-sesame text-grill-soft">
                <IconBurger className="size-7" />
              </span>
              <p className="font-semibold text-grill-soft">Aucun produit disponible pour le moment. Revenez vite !</p>
            </div>
          ) : (
            categories.map((category, catIndex) => {
              const categoryProducts = products.filter((p) => p.category === category);
              if (categoryProducts.length === 0) return null;
              const sectionId = `cat-${slugify(category)}`;

              return (
                <section key={category} id={sectionId} aria-labelledby={`${sectionId}-titre`} className="scroll-mt-24 space-y-5">
                  <CategoryHeading id={`${sectionId}-titre`} name={category} count={categoryProducts.length} accentIndex={catIndex} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {categoryProducts.map((product) => (
                      <article
                        key={product.id}
                        className={`group reveal flex gap-4 rounded-xl bg-crumb p-4 ring-sesame-dark transition-shadow duration-200 hover:ring-2 sm:p-5 ${!product.inStock ? 'opacity-70' : ''}`}
                      >
                        {product.imageUrl && (
                          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-sesame sm:size-24">
                            <Image src={product.imageUrl} alt={product.name} fill sizes="96px" className="object-cover transition-transform duration-500 ease-snappy group-hover:-rotate-2 group-hover:scale-110" />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-bold leading-snug sm:text-lg">{product.name}</h3>
                            <PriceTag value={product.price} />
                          </div>
                          {product.description && (
                            <p className="mt-1.5 text-sm leading-relaxed text-grill-soft">{product.description}</p>
                          )}
                          {!product.inStock && (
                            <div className="mt-auto pt-3">
                              <span className="inline-block rounded-md bg-ketchup-light px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ketchup-ink">
                                Indisponible
                              </span>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
