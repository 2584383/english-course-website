import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

/**
 * Efface les photos de profil d'un compte supprimé : le stockage n'est pas
 * relié à `auth.users`, rien ne part en cascade (droit à l'effacement).
 */
export async function deleteAvatarFiles(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const { data: files } = await admin.storage.from("avatars").list(userId);
  if (files?.length) {
    await admin.storage
      .from("avatars")
      .remove(files.map((file) => `${userId}/${file.name}`));
  }
}
