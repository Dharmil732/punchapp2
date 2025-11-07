
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
export default function SignIn(){
  const sb = createClientComponentClient(); const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState('');
  async function onSubmit(e){ e.preventDefault(); const { error } = await sb.auth.signInWithPassword({ email,password }); if(error){ setError(error.message); return; } router.push(next); }
  return (<div className="card" style={{maxWidth:420, margin:'40px auto'}}><h2>Sign In</h2>
    <form onSubmit={onSubmit} style={{display:'grid',gap:8}}>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      {error&&<p style={{color:'crimson'}}>{error}</p>}<button className="btn" type="submit">Sign In</button>
    </form><p><a href="/auth/reset">Forgot password?</a> · <a href="/auth/signup">Sign up</a></p></div>);
}
