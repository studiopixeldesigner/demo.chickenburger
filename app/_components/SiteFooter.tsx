"use client";
import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { BrandLockup, PHONE_DISPLAY, PHONE_HREF } from './SiteHeader';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=34+Rue+de+la+Gare,+70200+Lure';

// day = valeur de Date.getDay() (0 = dimanche)
const HOURS: { label: string; day: number; slots: string[] }[] = [
  { label: 'Lundi', day: 1, slots: ['18:00 - 22:00'] },
  { label: 'Mardi', day: 2, slots: [] },
  { label: 'Mercredi', day: 3, slots: ['17:30 - 22:00'] },
  { label: 'Jeudi', day: 4, slots: ['11:00 - 14:00', '18:00 - 22:00'] },
  { label: 'Vendredi', day: 5, slots: ['11:00 - 14:00', '18:00 - 22:00'] },
  { label: 'Samedi', day: 6, slots: ['18:00 - 22:00'] },
  { label: 'Dimanche', day: 0, slots: ['17:30 - 22:00'] },
];

const LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/suivi', label: 'Suivi de commande' },
  { href: '/provenance-viandes', label: 'Provenance des viandes' },
  { href: '/mentions-legales', label: 'Mentions légales' },
];

const noopSubscribe = () => () => {};

export default function SiteFooter() {
  // Jour courant côté client uniquement (null au rendu serveur, pas d'écart d'hydratation).
  const today = useSyncExternalStore(noopSubscribe, () => new Date().getDay(), () => null);

  return (
    <footer className="bg-espresso text-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-12 pt-16 sm:px-6 md:grid-cols-12 md:gap-8">
        <div className="reveal md:col-span-4">
          <BrandLockup tone="dark" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-muted">
            Spécialiste du tacos garni et du burger croustillant. Qualité irréprochable et produits frais garantis.
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.12em] text-cream-muted">Viandes</dt>
              <dd className="mt-0.5">Origine France, Pologne, Allemagne (Certifiées Halal).</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.12em] text-cream-muted">Adresse</dt>
              <dd className="mt-0.5">
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="underline decoration-cheddar decoration-2 underline-offset-4 transition-colors hover:text-cheddar">
                  34 Rue de la Gare, 70200 Lure
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.12em] text-cream-muted">Téléphone</dt>
              <dd className="mt-0.5">
                <a href={PHONE_HREF} className="underline decoration-cheddar decoration-2 underline-offset-4 tabular-nums transition-colors hover:text-cheddar">
                  {PHONE_DISPLAY}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="reveal md:col-span-3">
          <h2 className="mb-4 font-display text-xl uppercase">Horaires</h2>
          <ul className="space-y-1 text-sm">
            {HOURS.map((row) => {
              const isToday = row.day === today;
              return (
                <li
                  key={row.label}
                  className={`flex items-start justify-between gap-4 rounded-md px-2.5 py-1.5 ${isToday ? 'bg-espresso-line' : ''}`}
                >
                  <span className={`flex items-center gap-2 ${isToday ? 'font-bold' : 'text-cream-muted'}`}>
                    {isToday && <span className="size-2 animate-pulse rounded-sm bg-cheddar" aria-hidden="true" />}
                    {row.label}
                    {isToday && <span className="sr-only">(aujourd&apos;hui)</span>}
                  </span>
                  {row.slots.length === 0 ? (
                    <span className="rounded bg-ketchup px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Fermé</span>
                  ) : (
                    <span className="text-right tabular-nums">
                      {row.slots.map((slot) => (
                        <span key={slot} className="block">{slot}</span>
                      ))}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <nav aria-label="Informations" className="reveal md:col-span-2">
          <h2 className="mb-4 font-display text-xl uppercase">Informations</h2>
          <ul className="space-y-2.5 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-grow pb-0.5 text-cream-muted hover:text-cheddar">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="reveal md:col-span-3">
          <h2 className="mb-4 font-display text-xl uppercase">Nous trouver</h2>
          <div className="h-44 overflow-hidden rounded-lg bg-espresso-line">
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

      <div className="border-t border-espresso-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-cream-muted sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Chicken Burger Lure. Tous droits réservés.</p>
          <p>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="link-grow hover:text-cream">34 Rue de la Gare, 70200 Lure</a>
            {' — Tél : '}
            <a href={PHONE_HREF} className="link-grow tabular-nums hover:text-cream">{PHONE_DISPLAY}</a>
          </p>
          <p>
            Powered by{' '}
            <a href="https://studiopixeldesigner.github.io/pixeldesigner" target="_blank" rel="noopener noreferrer" className="font-semibold text-cheddar hover:underline">
              Pixel Designer
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
