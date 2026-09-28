"use client";
import React from 'react';
import SiteHeader from '@/app/_components/SiteHeader';
import SiteFooter from '@/app/_components/SiteFooter';
import { InfoSection, PageIntro } from '@/app/_components/ui';

const linkClass = 'font-semibold text-pickle-ink underline decoration-2 underline-offset-4 hover:text-grill';

export default function MentionsLegalesPage() {
  return (
    <>
      <SiteHeader />

      <main id="contenu" className="flex-1">
        <PageIntro eyebrow="Informations Légales" title="Mentions Légales" accent="bg-grill">
          Conformément aux dispositions des lois en vigueur, voici les informations obligatoires concernant l&apos;exploitation de ce site et de notre établissement.
        </PageIntro>

        <div className="mx-auto max-w-6xl space-y-3 px-4 pb-24 pt-4 sm:px-6">
          <InfoSection marker="01" accentIndex={0} title="Éditeur du site">
            <p>
              Le présent site est édité pour la société <strong className="text-grill">Chicken Burger Lure</strong>, par Pixel Designer<br />
              <strong className="text-grill">Adresse :</strong> 34 Rue de la Gare, 70200 Lure, France.<br />
              <strong className="text-grill">Téléphone :</strong> <a href="tel:0363751530" className={linkClass}>03 63 75 15 30</a>
            </p>
          </InfoSection>

          <InfoSection marker="02" accentIndex={1} title="Hébergement">
            <p>
              Le site est hébergé par <strong className="text-grill">Vercel Inc.</strong><br />
              <strong className="text-grill">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
              <strong className="text-grill">Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className={linkClass}>https://vercel.com</a>
            </p>
          </InfoSection>

          <InfoSection marker="03" accentIndex={2} title="Propriété intellectuelle">
            <p>
              L&apos;ensemble de ce site relève de la législation française et internationale sur le droit d&apos;auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </InfoSection>

          <InfoSection marker="04" accentIndex={0} title="Protection des données personnelles">
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification et d&apos;opposition aux données personnelles vous concernant. Aucune information personnelle n&apos;est cédée à des tiers.
            </p>
          </InfoSection>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
