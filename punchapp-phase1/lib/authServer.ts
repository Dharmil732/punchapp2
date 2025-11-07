import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (k: string) => cookieStore.get(k)?.value } }
  );
}
