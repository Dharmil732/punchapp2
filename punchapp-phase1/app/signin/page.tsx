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
    <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px"}}>
      <div className="card" style={{maxWidth:"480px",width:"100%"}}>
        <h1 style={{textAlign:"center",marginBottom:"12px"}}>Sign in</h1>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} view="sign_in" showLinks={false}/>
      </div>
    </div>
  );
}
