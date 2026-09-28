import Link from 'next/link';
import SiteHeader from '@/app/_components/SiteHeader';
import SiteFooter from '@/app/_components/SiteFooter';
import { IconArrowRight } from '@/app/_components/icons';

export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main id="contenu" className="flex flex-1 items-center">
        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <p className="flex animate-rise items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-grill-soft">
            <span className="size-2.5 rounded-sm bg-ketchup" aria-hidden="true" />
            Erreur 404
          </p>
          <h1 className="mt-4 animate-rise font-display [animation-delay:80ms] text-[clamp(3rem,10vw,6.5rem)] uppercase leading-[0.88]">
            Page <span className="inline-block animate-shake text-ketchup [animation-delay:700ms]">introuvable</span>
          </h1>
          <p className="mt-5 max-w-md animate-rise text-lg text-grill-soft [animation-delay:160ms]">
            Cette page n&apos;existe pas ou a été déplacée. La carte, elle, est toujours là.
          </p>
          <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
            <Link
              href="/"
              className="btn btn-grill px-6 py-3.5 text-sm"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/menu"
              className="group btn btn-cheddar px-6 py-3.5 text-sm"
            >
              Voir la carte
              <IconArrowRight className="size-4 transition-transform duration-300 ease-spring group-hover:translate-x-1.5" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
