import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { requireServiceRoleKey, requireSupabasePublicEnv } from "@/lib/env";

/**
 * Client à privilèges élevés : contourne la RLS.
 *
 * Réservé au code serveur de confiance (webhook Calendly, cron de rappels,
 * création de comptes par l'administrateur). Ne jamais l'importer côté client.
 */
export function createAdminClient() {
  const { url } = requireSupabasePublicEnv();
  return createSupabaseClient<Database>(url, requireServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
