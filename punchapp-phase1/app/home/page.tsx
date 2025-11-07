import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/authServer";
import ActionButtons from "@/components/ActionButtons";

export default async function HomePage(){
  const supabase=getServerSupabase();
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) redirect("/signin");

  // These queries are safe even if views don't exist: we show fallback UI
  const { data: shift } = await supabase.from("v_my_today_shifts").select("*").limit(1).maybeSingle();
  const { data: tasks } = await supabase.from("tasks").select("id,title,priority,due_at,status").order("due_at",{ascending:true}).limit(5);

  return (
    <div className="grid grid-2">
      <section className="card">
        <div className="card-title"><h2 className="text-lg font-semibold">Time</h2></div>
        <ActionButtons/>
      </section>
      <section className="card">
        <div className="card-title"><h2 className="text-lg font-semibold">Today&apos;s Shift</h2></div>
        {!shift ? <p className="text-muted">No scheduled shift today.</p> : (
          <div className="text-sm" style={{display:"grid",gap:"4px"}}>
            <div>Start: {shift.start_local ?? "—"}</div>
            <div>End: {shift.end_local ?? "—"}</div>
            <div>Store: {shift.store_name ?? "—"}</div>
          </div>
        )}
      </section>
      <section className="card" style={{gridColumn:"1 / -1"}}>
        <div className="card-title"><h2 className="text-lg font-semibold">My Tasks</h2></div>
        {!tasks?.length ? <p className="text-muted">No tasks.</p> : (
          <table><thead><tr><th>Title</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>{tasks!.map(t=>(<tr key={t.id}><td>{t.title}</td><td>{t.priority}</td><td>{t.due_at?.slice(0,16).replace("T"," ")}</td><td>{t.status}</td></tr>))}</tbody></table>
        )}
      </section>
    </div>
  );
}
