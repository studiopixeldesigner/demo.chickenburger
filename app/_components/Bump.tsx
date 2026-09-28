"use client";
import { useState, type ReactNode } from 'react';

// Rejoue une petite animation de rebond à chaque changement de valeur (pas au premier affichage).
export default function Bump({
  value,
  className = '',
  children,
}: {
  value: string | number;
  className?: string;
  children: ReactNode;
}) {
  const [previous, setPrevious] = useState(value);
  const [changes, setChanges] = useState(0);

  if (value !== previous) {
    setPrevious(value);
    setChanges((count) => count + 1);
  }

  return (
    <span key={changes} className={`${changes > 0 ? 'animate-bump' : ''} ${className}`}>
      {children}
    </span>
  );
}
