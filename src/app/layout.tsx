import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Quicksand } from "next/font/google";

import "./globals.css";

// Polices variables : toutes les graisses en un seul fichier, et l'axe
// optique de Nunito Sans adapte le dessin des lettres à la taille du texte.
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  display: "swap",
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "English with Lea — cours d'anglais sur mesure",
    template: "%s · English with Lea",
  },
  description:
    "Parcours d'anglais oral personnalisés : réservation de séances, comptes-rendus détaillés et suivi pédagogique continu.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "English with Lea",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e474c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Des extensions de navigateur ajoutent des attributs à <html> avant
    // l'hydratation : on ignore ces écarts sur cette balise uniquement.
    <html lang="fr" suppressHydrationWarning>
      <body className={`${quicksand.variable} ${nunito.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
