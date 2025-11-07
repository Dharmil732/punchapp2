import { runReminders } from '@/lib/reminders'; export async function GET(){ const res=await runReminders(); return Response.json({ ok:true, ...res }); }
