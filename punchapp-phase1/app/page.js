
'use client';
import { useUser } from '@/lib/useUser';
import Link from 'next/link';
export default function Home(){
  const { user } = useUser();
  if(!user) return <div className="card">Redirecting…</div>;
  return (<div className="grid grid-3">
    <section className="card"><h2>Quick Punch</h2><p>Tap to record your status.</p>
      <div className="flex">
        <form action="/api/punch/in" method="post"><button className="btn" type="submit">Punch In</button></form>
        <form action="/api/punch/out" method="post"><button className="btn" type="submit">Punch Out</button></form>
        <form action="/api/punch/break-in" method="post"><button className="btn" type="submit">Break Out</button></form>
        <form action="/api/punch/break-out" method="post"><button className="btn" type="submit">Break In</button></form>
      </div>
      <p style={{color:'var(--muted)'}}>Unscheduled? Submit justification in Requests.</p>
    </section>
    <section className="card"><h2>My Next Shift</h2><p>See your upcoming schedule.</p><Link href="/requests" className="nav-btn">Open Requests</Link></section>
    <section className="card"><h2>My Tasks</h2><p>Assigned tasks and due dates.</p><Link href="/tasks" className="nav-btn">Go to Tasks</Link></section>
  </div>);
}
