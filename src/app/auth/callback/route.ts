import { NextResponse, type NextRequest } from "next/server";

import { HOME_BY_ROLE } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";

/** Échange le code d'un lien magique / d'une invitation contre une session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien-invalide`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien-expire`);
  }

  if (next) return NextResponse.redirect(`${origin}${next}`);

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
