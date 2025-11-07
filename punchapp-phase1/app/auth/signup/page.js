
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
export default function Signup(){
  const sb = createClientComponentClient(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [done,setDone]=useState(false);
  async function onSubmit(e){ e.preventDefault(); const { error } = await sb.auth.signUp({ email, password }); if(error) alert(error.message); else setDone(true); }
  return (<div className="card" style={{maxWidth:420, margin:'40px auto'}}><h2>Sign Up</h2>
    {done ? <p>Check your email to confirm.</p> : <form onSubmit={onSubmit} style={{display:'grid',gap:8}}>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="btn" type="submit">Create account</button>
    </form>}
  </div>);
}
