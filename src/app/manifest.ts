import type { MetadataRoute } from "next";

/** Manifeste PWA : installation sur l'écran d'accueil sans App Store (CDC 4.1). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English with Lea",
    short_name: "English",
    description:
      "Réserve tes séances d'anglais, suis ton parcours et retrouve tes comptes-rendus.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7fbfa",
    theme_color: "#0e474c",
    lang: "fr",
    categories: ["education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
