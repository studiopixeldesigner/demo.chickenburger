"use client";
import React from 'react';
import SiteHeader from '@/app/_components/SiteHeader';
import SiteFooter from '@/app/_components/SiteFooter';
import { InfoSection, PageIntro } from '@/app/_components/ui';
import { IconBadgeCheck, IconGlobe, IconSnowflake } from '@/app/_components/icons';

export default function ProvenanceViandesPage() {
  return (
    <>
      <SiteHeader />

      <main id="contenu" className="flex-1">
        <PageIntro eyebrow="Transparence & Qualité" title="Provenance de nos viandes" accent="bg-pickle">
          Chez Chicken Burger Lure, nous accordons une importance capitale à l&apos;origine de nos produits et au respect de vos exigences.
        </PageIntro>

        <div className="mx-auto max-w-6xl space-y-3 px-4 pb-24 pt-4 sm:px-6">
          <InfoSection marker={<IconGlobe className="size-7" />} accentIndex={0} title="Origine française, polonaise et allemande">
            <p>
              Toutes nos viandes de volaille et steaks proviennent d&apos;exploitations françaises, polonaises et allemandes respectant les normes sanitaires les plus strictes de l&apos;Union Européenne. Nous privilégions les circuits courts pour garantir fraîcheur et traçabilité irréprochable.
            </p>
          </InfoSection>

          <InfoSection marker={<IconBadgeCheck className="size-7" />} accentIndex={2} title="Certification Halal Garantie">
            <p>
              Nous sommes engagés à proposer une alimentation entièrement certifiée Halal. Nos fournisseurs disposent de certifications officielles reconnues, vous assurant un respect total des rites et des contrôles réguliers tout au long de la chaîne de production.
            </p>
          </InfoSection>

          <InfoSection marker={<IconSnowflake className="size-7" />} accentIndex={1} title="Chaîne du Froid & Fraîcheur">
            <p>
              Chaque livraison fait l&apos;objet de contrôles rigoureux à réception. Les produits sont stockés et travaillés dans le respect absolu des normes d&apos;hygiène de la restauration rapide (HACCP).
            </p>
          </InfoSection>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
