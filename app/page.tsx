"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { withBasePath } from '@/lib/base-path';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IS_DEMO, useDemoOuvert } from '@/lib/demo';

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
          setTexteStatut("❌ Fermé exceptionnellement • Commandes impossible");
          return;
        }

        setIsVacationMode(false);

        if (settingsData?.force_open === true) {
          setIsForceOpenMode(true);
          setEstOuvert(true);
          setTexteStatut("🔥 Ouverture exceptionnelle — Commandes actives");
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

  const restaurantOuvert = IS_DEMO ? demoOuvert : estOuvert;
  const texteBarre = IS_DEMO
    ? (demoOuvert ? "Ouvert • Commandes en ligne actives" : "Restaurant Fermé (Impossible de commander)")
    : texteStatut;

  return (
    <main className="min-h-screen bg-[#40342C] text-[#FAF6F0] selection:bg-orange-500 selection:text-white overflow-x-hidden flex flex-col justify-between pt-24">
      <div>
        <div className={`text-white text-xs font-bold px-4 py-2.5 text-center uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          isVacationMode 
            ? "bg-purple-600 shadow-purple-900/20" 
            : isForceOpenMode
              ? "bg-amber-600 shadow-amber-900/20"
              : restaurantOuvert
                ? "bg-emerald-600 shadow-emerald-900/20"
                : "bg-red-600 shadow-red-900/20"
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full bg-white ${(restaurantOuvert || isForceOpenMode) && !isVacationMode ? "animate-ping" : ""}`}></span>
          {texteBarre}
        </div>

        <header className="bg-[#372D26]/90 backdrop-blur-md border-b border-[#59493E] p-4 fixed top-9 left-0 right-0 z-40 flex justify-between items-center px-6 transition-all duration-300 shadow-md">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-orange-500 shadow-lg shadow-orange-500/20 transform group-hover:scale-110 transition duration-300">
              <Image src={withBasePath('/logo.png')} alt="Chicken Burger Logo" fill className="object-cover" />
            </div>
            <span className="font-black text-lg tracking-tighter text-white">
              CHICKEN <span className="text-orange-400">BURGER</span>
            </span>
          </Link>

          <a 
            href="tel:0363751530"
            className="bg-[#4E3F35] hover:bg-[#5E4C40] text-white px-5 py-2.5 rounded-full font-bold text-sm border border-[#6B5749] transition duration-300 flex items-center gap-2.5 shadow-md hover:scale-105 active:scale-95"
          >
            <span className="text-emerald-500">03 63 75 15 30</span>
          </a>
        </header>

        <section className="relative h-[75vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden mt-6">
          <div className="absolute inset-0 z-0">
            <Image 
              src={withBasePath('/chickenburgerfond.jpeg')} 
              alt="Fond Chicken Burger" 
              fill 
              className="object-cover object-center transform scale-105 opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-[#40342C]/70 backdrop-blur-[1px]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#40342C] via-[#40342C]/40 to-transparent"></div>
          </div>

          <div className="relative z-20 max-w-2xl mx-auto">
            <span className="inline-block bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 shadow-sm backdrop-blur-md">
              🍔 Le goût authentique à Lure
            </span>
            
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-amber-400 bg-[length:200%_auto] animate-gradient drop-shadow-2xl">
              Chicken Burger
            </h1>
            
            <p className="text-[#F5F0E8] text-base sm:text-xl max-w-xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md">
              Savourez nos tacos généreux et nos burgers croustillants préparés avec passion. 
              {restaurantOuvert && !isVacationMode ? " Commandez en ligne dès maintenant !" : " Le restaurant ou les commandes en ligne sont actuellement fermés."}
            </p>

            {restaurantOuvert && !isVacationMode ? (
              <div className="animate-bounce inline-block">
                <Link 
                  href="/commander"
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 hover:brightness-110 text-white font-black px-10 py-5 rounded-full shadow-2xl shadow-rose-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95 tracking-wider uppercase text-sm"
                >
                  <span>Commander maintenant</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition duration-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 bg-[#4E3F35]/90 backdrop-blur-md text-[#E2D8CC] font-bold px-8 py-4 rounded-full border border-[#6B5749] tracking-wider uppercase text-xs cursor-not-allowed shadow-md">
                <span>🔒 {isVacationMode ? "Fermé exceptionnellement (Commandes bloquées)" : "Restaurant fermé"}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="bg-[#332922] border-t border-[#59493E] pt-16 pb-12 text-[#E2D8CC] text-sm">
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
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=34+Rue+de+la+Gare,+70200+Lure" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-400 hover:underline hover:text-emerald-300 transition"
                >
                  34 Rue de la Gare, 70200 Lure
                </a>
              </p>
              <p>
                <strong className="text-white">Téléphone : </strong>
                <a 
                  href="tel:0363751530" 
                  className="text-emerald-400 hover:underline hover:text-emerald-300 transition"
                >
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
              <li>
                <Link href="/menu" className="hover:text-orange-400 transition">Menu</Link>
              </li>
              <li>
                <Link href="/suivi" className="hover:text-orange-400 transition">Suivi de commande</Link>
              </li>
              <li>
                <Link href="/provenance-viandes" className="hover:text-orange-400 transition">Provenance des viandes</Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-orange-400 transition">Mentions légales</Link>
              </li>
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
    </main>
  );
}