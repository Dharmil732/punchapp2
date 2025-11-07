import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/authServer";
export default async function Page(){
  const s=getServerSupabase();
  const {data:{session}}=await s.auth.getSession();
  if(!session) redirect("/signin");
  const {data:profile}=await s.from("profiles").select("role").eq("id",session.user.id).single();
  const allowed=["manager", "admin"];
  if(!profile||!allowed.includes(profile.role)) redirect("/");
  return <main className="card"><h1 className="text-lg font-semibold">Settings</h1><p className='text-muted'>App-wide settings: break rules, geo, notifications.</p></main>;
}
