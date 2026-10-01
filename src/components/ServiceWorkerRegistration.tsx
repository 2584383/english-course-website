"use client";

import { useEffect } from "react";

/** Enregistre le service worker pour rendre l'application installable. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation hors-ligne indisponible : l'application reste utilisable.
      });
    };
    // Monté dans le layout racine : la page peut être déjà chargée.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
