"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconChevronLeft, IconChevronRight } from './icons';

// Rangée de filtres : tout est visible sur grand écran (retour à la ligne) ;
// sur les écrans plus étroits, défilement horizontal avec flèches quand il reste des éléments cachés.
export default function ChipScroller({
  label,
  activeKey,
  children,
}: {
  label: string;
  activeKey?: string;
  children: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;

    const update = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      const start = scroller.scrollLeft > 2;
      const end = max > 2 && scroller.scrollLeft < max - 2;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };

    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(track);
    scroller.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener('scroll', update);
    };
  }, []);

  // Garde l'élément actif visible dans la rangée.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!scroller || !active || scroller.scrollWidth <= scroller.clientWidth) return;
    const margin = 56;
    const left = active.offsetLeft - margin;
    const right = active.offsetLeft + active.offsetWidth + margin;
    if (left < scroller.scrollLeft) {
      scroller.scrollTo({ left, behavior: 'smooth' });
    } else if (right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollTo({ left: right - scroller.clientWidth, behavior: 'smooth' });
    }
  }, [activeKey]);

  const scrollByPage = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.7, behavior: 'smooth' });
  };

  const arrowClass =
    'pointer-events-auto grid size-9 place-items-center rounded-lg bg-grill text-bun transition-[scale,background-color] duration-150 hover:bg-grill-deep active:scale-90';

  return (
    <div role="group" aria-label={label} className="relative">
      <div ref={scrollerRef} className="no-scrollbar relative overflow-x-auto lg:overflow-visible">
        <div ref={trackRef} className="flex w-max gap-2 py-3 lg:w-auto lg:flex-wrap">
          {children}
        </div>
      </div>

      {edges.start && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex animate-fade-in items-center bg-bun pr-2 lg:hidden">
          <button type="button" onClick={() => scrollByPage(-1)} aria-label="Afficher les catégories précédentes" className={arrowClass}>
            <IconChevronLeft className="size-5" />
          </button>
        </div>
      )}
      {edges.end && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex animate-fade-in items-center bg-bun pl-2 lg:hidden">
          <button type="button" onClick={() => scrollByPage(1)} aria-label="Afficher les catégories suivantes" className={arrowClass}>
            <IconChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
