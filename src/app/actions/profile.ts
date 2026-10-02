"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "avatars";
const MAX_BYTES = 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Supprime les anciennes photos du dossier de l'utilisateur, sauf `keep`. */
async function clearAvatars(supabase: Supabase, userId: string, keep?: string) {
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);
  const stale = (files ?? [])
    .map((file) => `${userId}/${file.name}`)
    .filter((path) => path !== keep);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
}

/**
 * Enregistre la photo de profil (déjà recadrée et compressée par le
 * navigateur). Valable pour tous les rôles.
 */
export async function uploadAvatar(formData: FormData): Promise<{ error?: string }> {
  const { id } = await requireUser();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Aucune image reçue." };
  }
  const extension = TYPES[file.type];
  if (!extension) return { error: "Format accepté : JPEG, PNG ou WebP." };
  if (file.size > MAX_BYTES) return { error: "Image trop lourde (1 Mo maximum)." };

  const supabase = await createClient();
  const path = `${id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", id);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: error.message };
  }

  await clearAvatars(supabase, id, path);
  revalidatePath("/", "layout");
  return {};
}

export async function removeAvatar(): Promise<{ error?: string }> {
  const { id } = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", id);
  if (error) return { error: error.message };

  await clearAvatars(supabase, id);
  revalidatePath("/", "layout");
  return {};
}
