
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
export default function Reset(){
  const sb = createClientComponentClient(); const [email,setEmail]=useState(''); const [sent,setSent]=useState(false);
  async function onSubmit(e){ e.preventDefault(); await sb.auth.resetPasswordForEmail(email,{ redirectTo: `${location.origin}/auth/reset` }); setSent(true); }
  return (<div className="card" style={{maxWidth:420, margin:'40px auto'}}><h2>Reset Password</h2>
    {sent ? <p>Reset link sent.</p> : <form onSubmit={onSubmit} style={{display:'grid',gap:8}}>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="btn" type="submit">Send reset link</button>
    </form>}
  </div>);
}
