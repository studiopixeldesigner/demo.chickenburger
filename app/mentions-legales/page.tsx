"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { withBasePath } from '@/lib/base-path';
import Link from 'next/link';

interface FallingEmoji {
  id: number;
  emoji: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

export default function MentionsLegalesPage() {
  const [emojis, setEmojis] = useState<FallingEmoji[]>([]);

  useEffect(() => {
    const list = ['📝', '📄', '🖊️', '✏️', '📋', '⚖️'];
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

  return (
    <main className="min-h-screen bg-[#40342C] text-[#FAF6F0] selection:bg-emerald-500 selection:text-white flex flex-col justify-between relative overflow-hidden">
      
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.15;
          }
          90% {
            opacity: 0.15;
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
            opacity: 0;
          }
        }
        .falling-item {
          position: absolute;
          top: -50px;
          animation: fall linear infinite;
        }
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
              <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 transform group-hover:scale-115 transition duration-300">
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

          <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
            <span className="inline-block bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-sm backdrop-blur-md">
              Informations Légales
            </span>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 mb-4 drop-shadow-md">
              Mentions Légales
            </h1>
            <p className="text-[#F5F0E8] text-sm sm:text-base max-w-xl mx-auto font-medium">
              Conformément aux dispositions des lois en vigueur, voici les informations obligatoires concernant l'exploitation de ce site et de notre établissement.
            </p>
          </section>

          <div className="max-w-4xl mx-auto px-6 space-y-8 pb-16">
            
            <div className="bg-[#372D26]/90 backdrop-blur-sm border border-[#59493E] p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-3">
                <span>📋</span> 1. Éditeur du site
              </h2>
              <p className="text-[#CBC0B4] text-sm leading-relaxed font-medium">
                Le présent site est édité pour la société <strong>Chicken Burger Lure</strong>, par Pixel Designer<br />
                <strong>Adresse :</strong> 34 Rue de la Gare, 70200 Lure, France.<br />
                <strong>Téléphone :</strong> <a href="tel:0363751530" className="text-emerald-400 hover:underline">03 63 75 15 30</a>
              </p>
            </div>

            <div className="bg-[#372D26]/90 backdrop-blur-sm border border-[#59493E] p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-3">
                <span>🌐</span> 2. Hébergement
              </h2>
              <p className="text-[#CBC0B4] text-sm leading-relaxed font-medium">
                Le site est hébergé par <strong>Vercel Inc.</strong><br />
                <strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
                <strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">https://vercel.com</a>
              </p>
            </div>

            <div className="bg-[#372D26]/90 backdrop-blur-sm border border-[#59493E] p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-3">
                <span>⚖️</span> 3. Propriété intellectuelle
              </h2>
              <p className="text-[#CBC0B4] text-sm leading-relaxed font-medium">
                L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
              </p>
            </div>

            <div className="bg-[#372D26]/90 backdrop-blur-sm border border-[#59493E] p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-3">
                <span>📄</span> 4. Protection des données personnelles
              </h2>
              <p className="text-[#CBC0B4] text-sm leading-relaxed font-medium">
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et d'opposition aux données personnelles vous concernant. Aucune information personnelle n'est cédée à des tiers.
              </p>
            </div>

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
      </div>
    </main>
  );
}