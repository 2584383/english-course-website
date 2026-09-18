import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { requireSupabasePublicEnv } from "@/lib/env";

/**
 * Client Supabase pour les Server Components, Server Actions et Route Handlers.
 * À recréer à chaque requête : ne jamais mettre en cache dans une variable globale.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component : le rafraîchissement de session
          // est déjà assuré par le middleware, on peut ignorer.
        }
      },
    },
  });
}
