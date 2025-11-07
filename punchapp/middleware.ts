import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Allow static and API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|txt|map)$/)
  ) return NextResponse.next();

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (k) => req.cookies.get(k)?.value,
        set: (k,v,o) => res.cookies.set(k,v,o),
        remove: (k,o) => res.cookies.set(k,"",{...o,maxAge:0})
      }
    }
  );
  const { data: { session } } = await supabase.auth.getSession();

  if (pathname === "/signin") {
    if (session) { url.pathname = "/"; return NextResponse.redirect(url); }
    return res;
  }

  if (!session) {
    url.pathname = "/signin";
    url.search = `?returnTo=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|.*\\.(?:png|jpg|jpeg|svg|ico|css|js|txt|map)).*)"],
};
