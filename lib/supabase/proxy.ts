import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;
  const isLoggedIn = !error && Boolean(userId);

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith("/auth");
  const isBusinessRoute = pathname.startsWith("/business");

  function redirectTo(path: string) {
    const url = request.nextUrl.clone();

    url.pathname = path;
    url.search = "";

    const redirectResponse = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = supabaseResponse.headers.get(header);

      if (value) {
        redirectResponse.headers.set(header, value);
      }
    }

    return redirectResponse;
  }

  // לא מחובר ומנסה להיכנס לאפליקציה
  if (!isLoggedIn && !isAuthRoute) {
    return redirectTo("/auth");
  }

  // מסכי auth נשארים פתוחים כדי לא לשבור callback / verification
  if (!isLoggedIn) {
    return supabaseResponse;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId!)
    .maybeSingle();

  if (profileError) {
    console.error("Proxy profile error:", profileError);

    return supabaseResponse;
  }

  const role = profile?.role;

  // משתמש מחובר שנכנס למסך ההתחברות הראשי
  if (pathname === "/auth") {
    if (role === "business") {
      return redirectTo("/business");
    }

    if (role === "customer") {
      return redirectTo("/");
    }

    return supabaseResponse;
  }

  // חשבון עסקי יכול לעבוד רק בצד העסקי
  if (role === "business" && !isBusinessRoute && !isAuthRoute) {
    return redirectTo("/business");
  }

  // חשבון לקוח לא יכול להיכנס לצד העסקי
  if (role === "customer" && isBusinessRoute) {
    return redirectTo("/");
  }

  return supabaseResponse;
}
