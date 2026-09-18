import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

/**
 * Exécuté avant chaque requête : rafraîchit la session Supabase et applique
 * le routage par rôle (convention `proxy` de Next.js 16).
 */
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf les fichiers statiques, les images et
     * les artefacts PWA servis depuis /public.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
