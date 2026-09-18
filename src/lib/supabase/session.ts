import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import type { Database, UserRole } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

const HOME_BY_ROLE: Record<UserRole, string> = {
  student: "/app",
  teacher: "/prof",
  super_admin: "/admin",
};

const PUBLIC_PATHS = [
  "/",
  "/connexion",
  "/inscription",
  "/confidentialite",
  "/cgu",
  "/hors-ligne",
];

/**
 * Rafraîchit la session Supabase puis applique le routage par rôle.
 * Le cookie doit être réécrit sur la réponse renvoyée, sinon la session est perdue.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/auth/");

  if (!user) {
    if (isPublic) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suivant", pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  const role: UserRole = profile?.role ?? "student";

  if (profile?.status === "suspended" && pathname !== "/compte-suspendu") {
    const url = request.nextUrl.clone();
    url.pathname = "/compte-suspendu";
    return NextResponse.redirect(url);
  }

  // Un utilisateur connecté n'a rien à faire sur les pages d'authentification
  if (pathname === "/connexion" || pathname === "/inscription") {
    const url = request.nextUrl.clone();
    url.pathname = HOME_BY_ROLE[role];
    return NextResponse.redirect(url);
  }

  const forbidden =
    (pathname.startsWith("/admin") && role !== "super_admin") ||
    (pathname.startsWith("/prof") && role === "student") ||
    (pathname.startsWith("/app") && role !== "student");

  if (forbidden) {
    const url = request.nextUrl.clone();
    url.pathname = HOME_BY_ROLE[role];
    return NextResponse.redirect(url);
  }

  return response;
}

export { HOME_BY_ROLE };
