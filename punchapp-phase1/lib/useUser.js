
'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
export function useUser(){
  const [user,setUser]=useState(null); const [role,setRole]=useState(null); const [profile,setProfile]=useState(null);
  useEffect(()=>{ const sb=createClientComponentClient(); let m=true;
    sb.auth.getUser().then(async ({data})=>{ const u=data?.user||null; if(!m) return; setUser(u);
      if(u){ const {data:prof}=await sb.from('profiles').select('id,email,name,role,employee_code').eq('id',u.id).maybeSingle();
        setProfile(prof); setRole(prof?.role||'employee'); } });
    return ()=>{ m=false }; },[]);
  return { user, role, profile };
}
