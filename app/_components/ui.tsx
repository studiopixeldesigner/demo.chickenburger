import type { ReactNode } from 'react';

// Couleurs d'accent attribuées aux catégories, dans l'ordre de la carte.
const ACCENTS = ['bg-ketchup', 'bg-cheddar', 'bg-pickle'];

export function accentAt(index: number) {
  return ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length];
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const inputClass =
  'w-full rounded-lg border-2 border-transparent bg-bun px-4 py-2.5 text-base text-grill placeholder:text-grill-soft/70 transition-colors focus:border-grill focus:outline-none sm:text-sm';

export const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-grill-soft';

export function PageIntro({
  eyebrow,
  title,
  children,
  accent = 'bg-ketchup',
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  accent?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 md:pt-16">
      <p className="flex animate-rise items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-grill-soft">
        <span className={`size-2.5 animate-pop rounded-sm [animation-delay:200ms] ${accent}`} aria-hidden="true" />
        {eyebrow}
      </p>
      <h1 className="mt-4 max-w-4xl animate-rise font-display text-[clamp(2.75rem,8vw,5.5rem)] uppercase leading-[0.88] [animation-delay:70ms]">
        {title}
      </h1>
      {children && <p className="mt-5 max-w-xl animate-rise text-base text-grill-soft [animation-delay:150ms] sm:text-lg">{children}</p>}
      {actions && <div className="mt-7 flex animate-rise flex-wrap gap-3 [animation-delay:230ms]">{actions}</div>}
    </section>
  );
}

export function CategoryHeading({
  id,
  name,
  count,
  accentIndex,
}: {
  id?: string;
  name: string;
  count?: number;
  accentIndex: number;
}) {
  return (
    <h2 id={id} className="reveal flex items-center gap-3 font-display text-3xl uppercase leading-none sm:text-4xl">
      <span className={`h-7 w-2 shrink-0 rounded-sm sm:h-8 ${accentAt(accentIndex)}`} aria-hidden="true" />
      <span>{name}</span>
      {count !== undefined && (
        <span className="font-sans text-sm font-semibold normal-case tracking-normal text-grill-soft tabular-nums [font-stretch:100%]">
          {count}
        </span>
      )}
    </h2>
  );
}

export function InfoSection({
  marker,
  accentIndex,
  title,
  children,
}: {
  marker: ReactNode;
  accentIndex: number;
  title: string;
  children: ReactNode;
}) {
  const accent = accentAt(accentIndex);
  return (
    <section className="group reveal grid gap-5 rounded-2xl bg-crumb p-6 sm:grid-cols-[auto_1fr] sm:gap-7 sm:p-8">
      <span
        className={`grid size-14 place-items-center rounded-xl font-display text-2xl transition-transform duration-500 ease-spring group-hover:-rotate-6 group-hover:scale-110 ${accent} ${
          accent === 'bg-cheddar' ? 'text-espresso' : 'text-white'
        }`}
        aria-hidden="true"
      >
        {marker}
      </span>
      <div>
        <h2 className="text-xl font-bold leading-snug sm:text-2xl">{title}</h2>
        <div className="mt-3 max-w-2xl text-base leading-relaxed text-grill-soft">{children}</div>
      </div>
    </section>
  );
}

export function PriceTag({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md bg-cheddar px-2 py-1 font-display text-lg leading-none text-espresso tabular-nums ${className}`}
    >
      {value.toFixed(2)} €
    </span>
  );
}
