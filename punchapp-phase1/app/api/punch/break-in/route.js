
import { serverAdmin } from '@/lib/serverAdmin';

async function getUserId(req){
  const uid = req.headers.get('x-user-id');
  if (uid) return uid;
  return null;
}

async function nearestShift(sb, user_id, atISO){
  const { data, error } = await sb
    .from('shifts')
    .select('id,start_at,end_at')
    .lte('start_at', atISO)
    .gte('end_at', atISO)
    .eq('user_id', user_id)
    .limit(1)
    .maybeSingle();
  if (data) return data.id;
  const { data: around } = await sb.from('shifts')
    .select('id,start_at')
    .eq('user_id', user_id)
    .gte('start_at', new Date(Date.parse(atISO) - 12*3600*1000).toISOString())
    .lte('start_at', new Date(Date.parse(atISO) + 12*3600*1000).toISOString())
    .order('start_at', { ascending: true });
  return around?.[0]?.id || null;
}

async function isDuplicate(sb, user_id, kind, atISO){
  const { data } = await sb.from('punches').select('id,kind,at').eq('user_id',user_id).order('at',{ascending:false}).limit(1);
  const last = data?.[0]; if(!last) return false;
  return (last.kind===kind && Math.abs((new Date(atISO)-new Date(last.at)))<60000);
}

export async function handler(kind, req){
  const sb = serverAdmin(); const at = new Date().toISOString();
  const user_id = await getUserId(req);
  if(!user_id) return Response.json({ ok:false, error:'No user' }, { status: 401 });
  if(await isDuplicate(sb, user_id, kind, at)) return Response.json({ ok:false, error:'Duplicate' }, { status: 409 });
  const shift_id = await nearestShift(sb, user_id, at);
  const { error } = await sb.from('punches').insert({ user_id, kind, at, shift_id, client_meta:{ system:true } });
  if(error) return Response.json({ ok:false, error:error.message }, { status: 500 });
  return Response.json({ ok:true, kind, at, shift_id });
}

export async function POST(req){ return handler('break_in', req); }
