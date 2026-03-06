import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import type { AppRole } from "@/lib/types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname.startsWith("/login");
  const protectedRoutes = [
    "/dashboard",
    "/usuarios",
    "/financeiro",
    "/cadastros",
    "/conta",
    "/relatorios",
    "/administracao",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  let role: AppRole = "associado";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle<{ role: AppRole }>();

    if (profile?.role) {
      role = profile.role;
    }
  }

  if (user && isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      role === "operador" ? "/financeiro/despesas" : "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && role === "operador") {
    const isApiRoute = pathname.startsWith("/api/");
    const isAllowedOperatorRoute =
      pathname === "/financeiro/despesas" || pathname === "/financeiro";

    if (!isApiRoute && !isAllowedOperatorRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/financeiro/despesas";
      redirectUrl.searchParams.set("denied", "1");
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname === "/financeiro") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/financeiro/despesas";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
