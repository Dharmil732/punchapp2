
export async function sendEmail({ to, subject, html }){
  const key = process.env.RESEND_API_KEY;
  if(!key) return { ok:false, error:'RESEND_API_KEY not set' };
  const res = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ from:'Pharmasave Punch <no-reply@pharmasave-punch.app>', to:[to], subject, html })
  });
  const j = await res.json().catch(()=>({}));
  return { ok: res.ok, status: res.status, data: j };
}
export async function notify({ to, subject, html }){ return sendEmail({ to, subject, html }); }
