import { NextResponse, type NextRequest } from "next/server";

import type { EmailOtpType } from "@supabase/supabase-js";

import { HOME_BY_ROLE } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Liens des emails Supabase au format `token_hash` (modèles d'email
 * « Reset password », « Invite user », « Confirm signup »).
 *
 * Contrairement à `/auth/callback` (échange de code PKCE), ce lien fonctionne
 * même ouvert sur un autre appareil que celui qui a fait la demande.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien-invalide`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien-expire`);
  }

  // Mot de passe oublié ou invitation : on choisit (ou rechoisit) son mot de passe
  if (type === "recovery" || type === "invite") {
    return NextResponse.redirect(`${origin}/nouveau-mot-de-passe`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  return NextResponse.redirect(
    `${origin}${HOME_BY_ROLE[profile?.role ?? "student"]}`,
  );
}
