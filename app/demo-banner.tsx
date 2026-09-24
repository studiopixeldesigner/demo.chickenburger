"use client";
import { IS_DEMO, setDemoOuvert, useDemoOuvert } from '@/lib/demo';

export default function DemoBanner() {
  const ouvert = useDemoOuvert();

  if (!IS_DEMO) return null;

  return (
    <div className="sticky bottom-0 z-30 bg-[#1F1813]/95 backdrop-blur-md border-t-2 border-sky-400 px-4 py-3 shadow-2xl">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-xs text-[#E2D8CC] leading-relaxed">
          <span className="inline-block bg-sky-400 text-[#1F1813] font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider mr-2">Démo</span>
          Ce site est une <strong className="text-white">démonstration</strong> : aucune commande n&apos;est envoyée au restaurant et aucun paiement n&apos;est demandé.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#CBC0B4]">Restaurant :</span>
          <div role="group" aria-label="État du restaurant (démo)" className="flex bg-[#372D26] border border-[#59493E] rounded-full p-1">
            <button
              type="button"
              aria-pressed={ouvert}
              onClick={() => setDemoOuvert(true)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${ouvert ? 'bg-emerald-600 text-white shadow-md' : 'text-[#CBC0B4] hover:text-white'}`}
            >
              Ouvert
            </button>
            <button
              type="button"
              aria-pressed={!ouvert}
              onClick={() => setDemoOuvert(false)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${!ouvert ? 'bg-red-600 text-white shadow-md' : 'text-[#CBC0B4] hover:text-white'}`}
            >
              Fermé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
