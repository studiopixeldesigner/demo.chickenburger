"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { withBasePath } from '@/lib/base-path';
import { IS_DEMO, useDemoOuvert } from '@/lib/demo';
import SiteHeader, { PHONE_DISPLAY, PHONE_HREF } from '@/app/_components/SiteHeader';
import SiteFooter from '@/app/_components/SiteFooter';
import { IconArrowRight, IconBurger, IconLock, IconMapPin, IconPhone, IconReceipt } from '@/app/_components/icons';

export default function VitrineClient() {
  const [estOuvert, setEstOuvert] = useState<boolean | null>(null);
  const [texteStatut, setTexteStatut] = useState("Vérification des horaires...");
  const [isVacationMode, setIsVacationMode] = useState(false);
  const [isForceOpenMode, setIsForceOpenMode] = useState(false);
  const demoOuvert = useDemoOuvert();

  useEffect(() => {
    if (IS_DEMO) return;

    const verifierStatutGlobal = async () => {
      try {
        const { data: settingsData } = await supabase.from('settings').select('force_closed, force_open').single();

        if (settingsData?.force_closed === true) {
          setIsVacationMode(true);
          setIsForceOpenMode(false);
          setEstOuvert(false);
          setTexteStatut("Fermé exceptionnellement • Commandes impossible");
          return;
        }

        setIsVacationMode(false);

        if (settingsData?.force_open === true) {
          setIsForceOpenMode(true);
          setEstOuvert(true);
          setTexteStatut("Ouverture exceptionnelle — Commandes actives");
          return;
        }

        setIsForceOpenMode(false);

        const maintenant = new Date();
        const jour = maintenant.getDay();
        const heure = maintenant.getHours();
        const minute = maintenant.getMinutes();
        const heureDecimale = heure + minute / 60;

        let ouvert = false;
        let statut = "Fermé actuellement";

        switch (jour) {
          case 2:
            ouvert = false;
            statut = "Restaurant Fermé (Impossible de commander)";
            break;
          case 3:
            ouvert = heureDecimale >= 18.0 && heureDecimale < 21.75;
            statut = ouvert ? "Ouvert • Commandes en ligne actives" : "Restaurant Fermé (Impossible de commander)";
            break;
          case 4:
          case 5:
            if ((heureDecimale >= 11.5 && heureDecimale < 13.75) || (heureDecimale >= 18.5 && heureDecimale < 21.75)) {
              ouvert = true;
              statut = "Restaurant ouvert • Commandes actives";
            } else {
              statut = "Restaurant Fermé (Impossible de commander)";
            }
            break;
          case 6:
            ouvert = heureDecimale >= 18.5 && heureDecimale < 21.75;
            statut = ouvert ? "Ouvert • Commandes en ligne actives" : "Restaurant Fermé (Impossible de commander)";
            break;
          case 0:
            ouvert = heureDecimale >= 18.0 && heureDecimale < 21.75;
            statut = ouvert ? "Ouvert • Commandes en ligne actives" : "Restaurant Fermé (Impossible de commander)";
            break;
          case 1:
            ouvert = heureDecimale >= 18.5 && heureDecimale < 21.75;
            statut = ouvert ? "Ouvert • Commandes en ligne actives" : "Restaurant Fermé (Impossible de commander)";
            break;
          default:
            ouvert = false;
        }

        setEstOuvert(ouvert);
        setTexteStatut(statut);
      } catch (err) {
        console.error("Erreur lors de la vérification du statut:", err);
        setEstOuvert(false);
      }
    };

    verifierStatutGlobal();
    const interval = setInterval(verifierStatutGlobal, 60000);
    return () => clearInterval(interval);
  }, []);

  // En démo, l'état du restaurant vient de la bannière de démonstration.
  const restaurantOuvert = IS_DEMO ? demoOuvert : estOuvert;
  const texteBarre = IS_DEMO
    ? (demoOuvert ? "Ouvert • Commandes en ligne actives" : "Restaurant Fermé (Impossible de commander)")
    : texteStatut;

  const commandesActives = restaurantOuvert === true && !isVacationMode;
  const dotPulse = (restaurantOuvert || isForceOpenMode) && !isVacationMode;
  const statusTone = isVacationMode
    ? "bg-espresso text-cream"
    : isForceOpenMode
      ? "bg-cheddar text-espresso"
      : restaurantOuvert
        ? "bg-pickle text-white"
        : restaurantOuvert === null
          ? "bg-sesame text-grill"
          : "bg-ketchup text-white";

  const statusBar = (
    <div
      role="status"
      className={`flex min-h-9 items-center justify-center gap-2.5 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] transition-colors duration-500 sm:text-xs ${statusTone}`}
    >
      <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
        {dotPulse && <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />}
        <span className={`relative size-2.5 rounded-full ${isVacationMode ? "bg-cheddar" : "bg-current"}`} />
      </span>
      <span key={texteBarre} className="animate-fade-in">{texteBarre}</span>
    </div>
  );

  return (
    <>
      <SiteHeader topBar={statusBar} />

      <main id="contenu" className="flex-1 overflow-x-clip">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-12 md:gap-10 md:pb-24 md:pt-16">
          <div className="md:col-span-6">
            <p className="inline-flex animate-rise items-center gap-2 rounded-md bg-grill px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-bun">
              Burgers & tacos · Lure
            </p>

            <h1 className="mt-6 font-display text-[clamp(4rem,15vw,8.5rem)] uppercase leading-[0.8]">
              <span className="block overflow-hidden py-[0.03em]">
                <span className="block animate-line-up [animation-delay:90ms]">Chicken</span>
              </span>
              <span className="block overflow-hidden py-[0.03em]">
                <span className="block animate-line-up text-ketchup [animation-delay:200ms]">Burger</span>
              </span>
            </h1>

            <p className="mt-7 max-w-md animate-rise text-lg leading-relaxed text-grill-soft [animation-delay:320ms]">
              Savourez nos tacos généreux et nos burgers croustillants préparés avec passion.
              {commandesActives ? " Commandez en ligne dès maintenant !" : " Le restaurant ou les commandes en ligne sont actuellement fermés."}
            </p>

            <div className="mt-8 flex animate-rise flex-wrap items-center gap-3 [animation-delay:420ms]">
              {restaurantOuvert === null ? (
                <span className="h-[52px] w-64 animate-pulse rounded-lg bg-sesame" aria-hidden="true" />
              ) : commandesActives ? (
                <Link
                  href="/commander"
                  className="group btn btn-ketchup animate-fade-in gap-3 px-7 py-4 text-sm uppercase tracking-[0.08em]"
                >
                  Commander maintenant
                  <IconArrowRight className="size-5 transition-transform duration-300 ease-spring group-hover:translate-x-1.5" />
                </Link>
              ) : (
                <span className="inline-flex animate-fade-in cursor-not-allowed items-center gap-2.5 rounded-lg bg-sesame px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-grill-soft">
                  <IconLock className="size-4" />
                  {isVacationMode ? "Fermé exceptionnellement (Commandes bloquées)" : "Restaurant fermé"}
                </span>
              )}
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-4 text-sm font-bold text-grill underline decoration-cheddar decoration-[3px] underline-offset-[6px] transition-[color,text-underline-offset] duration-300 hover:text-ketchup-ink hover:underline-offset-[10px]"
              >
                Voir la carte
              </Link>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=34+Rue+de+la+Gare,+70200+Lure"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex animate-rise items-center gap-2 text-sm font-semibold text-grill-soft transition-colors hover:text-grill [animation-delay:500ms]"
            >
              <IconMapPin className="size-4 text-ketchup group-hover:animate-bounce" />
              34 Rue de la Gare, 70200 Lure
            </a>
          </div>

          <div className="group/photo relative md:col-span-6">
            <div
              className="absolute inset-0 translate-x-3 translate-y-3 animate-drop-in rounded-2xl bg-cheddar transition-[translate] duration-500 ease-snappy [animation-delay:450ms] group-hover/photo:translate-x-5 group-hover/photo:translate-y-5 sm:translate-x-5 sm:translate-y-5 sm:group-hover/photo:translate-x-7 sm:group-hover/photo:translate-y-7"
              aria-hidden="true"
            />
            <div className="relative aspect-[5/4] animate-photo-in overflow-hidden rounded-2xl bg-sesame [animation-delay:150ms]">
              <Image
                src={withBasePath('/chickenburgerfond.jpeg')}
                alt="Frites au cheddar, nuggets, salade de poulet croustillant et dessert sur un plateau rouge"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1.2s] ease-snappy group-hover/photo:scale-105"
              />
            </div>
            <div className="absolute -bottom-7 -left-2 animate-pop [animation-delay:750ms] sm:-left-6">
              <div className="grid size-28 -rotate-12 place-items-center rounded-full bg-pickle text-center text-white transition-[rotate,scale] duration-500 ease-spring hover:rotate-6 hover:scale-110 sm:size-32">
                <span className="animate-float leading-none [animation-delay:1.4s]">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px]">Viandes</span>
                  <span className="block font-display text-4xl uppercase sm:text-[2.6rem]">Halal</span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px]">certifiées</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Accès rapides" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:pb-28">
          <div className="grid gap-3 md:grid-cols-12 md:grid-rows-2">
            <Link
              href="/menu"
              className="group reveal relative flex min-h-64 flex-col justify-between overflow-hidden rounded-2xl bg-cheddar p-7 text-espresso transition-[translate] duration-300 ease-snappy hover:-translate-y-1.5 md:col-span-7 md:row-span-2 md:min-h-96 md:p-9"
            >
              <span className="absolute -bottom-24 -right-20 size-72 rounded-full bg-cheddar-dark/25 transition-transform duration-700 ease-snappy group-hover:scale-125" aria-hidden="true" />
              <IconBurger className="absolute right-7 top-7 size-16 text-cheddar-dark/60 transition-transform duration-500 ease-spring group-hover:-rotate-12 group-hover:scale-110 md:right-9 md:top-9 md:size-20" />
              <span className="relative text-xs font-bold uppercase tracking-[0.16em]">La carte</span>
              <span className="relative">
                <span className="block font-display text-5xl uppercase leading-[0.9] md:text-7xl">
                  Burgers,<br />tacos & menus
                </span>
                <span className="mt-5 inline-flex items-center gap-2 font-bold">
                  Voir toute la carte
                  <IconArrowRight className="size-5 transition-transform duration-300 ease-spring group-hover:translate-x-1.5" />
                </span>
              </span>
            </Link>

            <Link
              href="/suivi"
              className="group reveal flex min-h-44 flex-col justify-between gap-6 rounded-2xl bg-pickle p-7 text-white transition-[translate] duration-300 ease-snappy hover:-translate-y-1.5 md:col-span-5"
            >
              <IconReceipt className="size-7 group-hover:animate-wiggle" />
              <span>
                <span className="flex items-center justify-between gap-4 font-display text-3xl uppercase leading-none">
                  Suivre ma commande
                  <IconArrowRight className="size-6 shrink-0 transition-transform duration-300 ease-spring group-hover:translate-x-1.5" />
                </span>
                <span className="mt-2 block text-sm text-white/85">Avec votre numéro de commande ou de téléphone.</span>
              </span>
            </Link>

            <a
              href={PHONE_HREF}
              aria-label={`Appeler Chicken Burger au ${PHONE_DISPLAY}`}
              className="group reveal flex min-h-44 flex-col justify-between gap-6 rounded-2xl bg-grill p-7 text-bun transition-[translate] duration-300 ease-snappy hover:-translate-y-1.5 md:col-span-5"
            >
              <span className="flex items-center justify-between gap-4">
                <IconPhone className="size-7 text-cheddar group-hover:animate-wiggle" />
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-sesame-dark">Appeler le restaurant</span>
              </span>
              <span>
                <span className="flex items-center justify-between gap-4 font-display text-4xl leading-none tabular-nums sm:text-5xl">
                  {PHONE_DISPLAY}
                  <IconArrowRight className="size-6 shrink-0 transition-transform duration-300 ease-spring group-hover:translate-x-1.5" />
                </span>
                <span className="mt-2 block text-sm text-sesame-dark">Une question sur la carte ou sur votre commande ? Appelez‑nous.</span>
              </span>
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
