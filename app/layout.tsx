import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import DemoBanner from "./_components/DemoBanner";
import { IS_DEMO } from "@/lib/demo-mode";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: IS_DEMO ? "Chicken Burger - Lure (démo)" : "Chicken Burger - Lure",
  description: "Commandez vos burgers et tacos en ligne chez Chicken Burger à Lure.",
  // La démo ne doit pas concurrencer le vrai site dans les moteurs de recherche.
  ...(IS_DEMO && { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3eadb" },
    { media: "(prefers-color-scheme: dark)", color: "#2a221d" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bun text-grill">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-grill focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-bun"
        >
          Aller au contenu
        </a>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
