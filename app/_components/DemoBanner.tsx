"use client";
import { IS_DEMO, setDemoOuvert, useDemoOuvert } from '@/lib/demo';

export default function DemoBanner() {
  const ouvert = useDemoOuvert();

  if (!IS_DEMO) return null;

  const toggleClass = (active: boolean, activeBg: string) =>
    `rounded-md px-3 py-1 text-xs font-bold transition duration-200 active:scale-95 ${
      active ? `${activeBg} text-white` : 'text-cream-muted hover:text-cream'
    }`;

  return (
    <div className="bg-espresso text-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2.5 px-4 py-2.5 text-center sm:flex-row sm:px-6 sm:text-left">
        <p className="text-xs leading-relaxed text-cream-muted">
          <span className="mr-2 inline-block rounded bg-cheddar px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-espresso">
            Démo
          </span>
          Site de <strong className="text-cream">démonstration</strong> réalisé par{' '}
          <a
            href="https://studiopixeldesigner.github.io/pixeldesigner"
            target="_blank"
            rel="noopener noreferrer"
            className="link-grow font-semibold text-cheddar"
          >
            Pixel Designer
          </a>{' '}
          : aucune commande n&apos;est envoyée au restaurant et aucun paiement n&apos;est demandé.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-cream-muted">Restaurant :</span>
          <div role="group" aria-label="État du restaurant (démo)" className="flex rounded-lg bg-espresso-line p-1">
            <button type="button" aria-pressed={ouvert} onClick={() => setDemoOuvert(true)} className={toggleClass(ouvert, 'bg-pickle')}>
              Ouvert
            </button>
            <button type="button" aria-pressed={!ouvert} onClick={() => setDemoOuvert(false)} className={toggleClass(!ouvert, 'bg-ketchup')}>
              Fermé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
