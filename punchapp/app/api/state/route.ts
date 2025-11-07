import { NextResponse } from "next/server";
export async function GET(){
  // demo always "idle" until wired to Supabase
  return NextResponse.json({ state: "idle" });
}
