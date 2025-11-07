
'use client';
import Link from 'next/link';
import { useUser } from '@/lib/useUser';
export default function MobileNav(){
  const { user, role } = useUser();
  if(!user) return (<header className="nav-wrap"><div><Link href="/">Punch</Link></div><nav><Link href="/auth/sign-in" className="nav-btn">Sign In</Link></nav></header>);
  return (<header className="nav-wrap" style={{gap:8}}>
    <div><Link href="/">Punch</Link></div>
    <nav style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <Link href="/" className="nav-btn">Home</Link>
      <Link href="/tasks" className="nav-btn">Tasks</Link>
      <Link href="/requests" className="nav-btn">Requests</Link>
      {(role==='supervisor'||role==='manager'||role==='admin')&&<>
        <Link href="/admin/corrections" className="nav-btn">Corrections</Link>
        <Link href="/admin/analytics" className="nav-btn">Analytics</Link>
        <Link href="/admin/payroll" className="nav-btn">Payroll</Link>
      </>}
      {(role==='manager'||role==='admin')&&<>
        <Link href="/admin/requests" className="nav-btn">Review</Link>
        <Link href="/admin/shifts" className="nav-btn">Shifts</Link>
        <Link href="/admin/users" className="nav-btn">Users</Link>
        <Link href="/admin/settings" className="nav-btn">Settings</Link>
        <Link href="/market" className="nav-btn">Marketplace</Link>
      </>}
      {role==='admin'&&<>
        <Link href="/admin/exports" className="nav-btn">Exports</Link>
        <Link href="/admin/audit" className="nav-btn">Audit</Link>
        <Link href="/admin/integrations" className="nav-btn">Integrations</Link>
      </>}
    </nav>
  </header>);
}
