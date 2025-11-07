import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/authServer";

export default async function Page() {
  const supabase = getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();

  if (profile?.role === "admin")      redirect("/admin");
  if (profile?.role === "manager")    redirect("/reports");
  if (profile?.role === "supervisor") redirect("/supervisor");
  redirect("/home");
}
