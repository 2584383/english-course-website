import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Télécharge une ressource stockée dans le bucket privé `resources`.
 * La RLS garantit que seuls l'enseignant propriétaire et les étudiants
 * destinataires du partage peuvent obtenir l'URL signée.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: resource } = await supabase
    .from("resources")
    .select("storage_path, external_url")
    .eq("id", id)
    .maybeSingle();

  if (!resource) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  if (resource.external_url) {
    return NextResponse.redirect(resource.external_url);
  }

  if (!resource.storage_path) {
    return NextResponse.json({ error: "Fichier absent" }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from("resources")
    .createSignedUrl(resource.storage_path, 60 * 10);

  if (error || !signed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
