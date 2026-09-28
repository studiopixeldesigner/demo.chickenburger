"use client";
import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';
import { IconMenu, IconPhone, IconX } from './icons';

export const PHONE_DISPLAY = '03 63 75 15 30';
export const PHONE_HREF = 'tel:0363751530';

const NAV_LINKS = [
  { href: '/menu', label: 'La carte' },
  { href: '/commander', label: 'Commander' },
  { href: '/suivi', label: 'Suivi de commande' },
  { href: '/provenance-viandes', label: 'Provenance' },
];

const MOBILE_LINKS = [
  { href: '/', label: 'Accueil' },
  ...NAV_LINKS,
  { href: '/mentions-legales', label: 'Mentions légales' },
];

export function BrandLockup({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span className="group/brand flex items-center gap-3">
      <span className="relative size-10 shrink-0 overflow-hidden rounded-full transition-transform duration-500 ease-spring group-hover/brand:-rotate-12 group-hover/brand:scale-110">
        <Image src={withBasePath('/logo.png')} alt="" fill sizes="40px" className="object-cover" />
      </span>
      <span className={`font-display text-[1.35rem] uppercase leading-none ${tone === 'dark' ? 'text-cream' : 'text-grill'}`}>
        Chicken <span className={tone === 'dark' ? 'text-cheddar' : 'text-ketchup'}>Burger</span>
      </span>
    </span>
  );
}

export function PhoneButton() {
  return (
    <a
      href={PHONE_HREF}
      aria-label={`Appeler le ${PHONE_DISPLAY}`}
      className="group btn btn-pickle h-10 px-3 text-sm sm:px-4"
    >
      <IconPhone className="size-4 group-hover:animate-wiggle" />
      <span className="hidden tabular-nums sm:inline">{PHONE_DISPLAY}</span>
    </a>
  );
}

export default function SiteHeader({ action, topBar }: { action?: ReactNode; topBar?: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      {topBar}
      <div className="border-b border-sesame-dark bg-bun">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Chicken Burger, retour à l'accueil" className="rounded-md">
            <BrandLockup />
          </Link>

          <nav aria-label="Navigation principale" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative block rounded-md px-3 py-2 text-sm font-semibold transition duration-200 active:scale-95 ${
                        active ? 'bg-grill text-bun' : 'text-grill hover:-translate-y-0.5 hover:bg-sesame'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {action ?? <PhoneButton />}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="grid size-10 place-items-center rounded-lg bg-crumb text-grill transition duration-200 hover:bg-sesame active:scale-90 md:hidden"
            >
              <span key={menuOpen ? 'open' : 'closed'} className="grid animate-pop place-items-center">
                {menuOpen ? <IconX className="size-5" /> : <IconMenu className="size-5" />}
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="menu-mobile" aria-label="Navigation mobile" className="animate-menu-down border-t border-sesame-dark md:hidden">
            <ul className="mx-auto grid max-w-6xl gap-1 px-4 py-3">
              {MOBILE_LINKS.map((link, index) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href} className="animate-rise" style={{ animationDelay: `${index * 35}ms` }}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`block rounded-lg px-4 py-3 text-base font-semibold transition-colors ${
                        active ? 'bg-grill text-bun' : 'text-grill hover:bg-sesame'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li className="animate-rise pt-2" style={{ animationDelay: `${MOBILE_LINKS.length * 35}ms` }}>
                <a
                  href={PHONE_HREF}
                  className="group btn btn-pickle flex justify-start gap-3 px-4 py-3 text-base"
                >
                  <IconPhone className="size-5 group-hover:animate-wiggle" />
                  <span className="tabular-nums">{PHONE_DISPLAY}</span>
                </a>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
