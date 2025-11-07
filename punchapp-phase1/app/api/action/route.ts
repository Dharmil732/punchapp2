import { NextResponse } from "next/server";
export async function POST(req: Request){
  const body = await req.json();
  const action = String(body?.action||"");
  const client_ts = body?.client_ts || new Date().toISOString();
  // Demo success; wire to Supabase RPC for real behavior
  return NextResponse.json({ ok:true, action, client_ts });
}
