"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getClientSupabase } from "@/lib/authClient";

export default function SignIn() {
  const supabase = getClientSupabase();
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/";

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "SIGNED_IN") router.replace(returnTo);
    });
    return () => sub.subscription.unsubscribe();
  }, [router, returnTo, supabase]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl shadow border border-white/10 p-6">
        <h1 className="text-xl font-semibold mb-4 text-center">Sign in</h1>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} view="sign_in" showLinks={false} />
      </div>
    </div>
  );
}
