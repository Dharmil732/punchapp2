"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getClientSupabase } from "@/lib/authClient";

type Role = "admin" | "manager" | "supervisor" | "employee" | "view";

export default function RoleNav() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = getClientSupabase();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setRole(null); setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      setRole((data?.role ?? "employee") as Role);
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) return null;

  const item = (href: string, label: string, show: boolean) => {
    const active = pathname === href;
    return show ? <Link key={href} className={active ? "active" : ""} href={href}>{label}</Link> : null;
  };

  return (
    <nav className="nav">
      {item("/home","Home",true)}
      {item("/tasks","Tasks",true)}
      {item("/shifts","Shifts",true)}
      {item("/requests","Requests",true)}
      {item("/reports","Reports",role==="supervisor"||role==="manager"||role==="admin")}
      {item("/settings","Settings",role==="manager"||role==="admin")}
      {item("/supervisor","Supervisor",role==="supervisor"||role==="manager"||role==="admin")}
      {item("/admin","Admin",role==="admin")}
    </nav>
  );
}
