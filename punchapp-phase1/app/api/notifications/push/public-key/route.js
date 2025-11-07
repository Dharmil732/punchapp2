export async function GET(){ const pk=process.env.VAPID_PUBLIC_KEY||''; return new Response(pk, { headers: { 'Content-Type': 'text/plain' } }); }
