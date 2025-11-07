import { NextResponse } from "next/server";
const demo = [
  { id: "t1", title: "FaceUp cold aisle", priority: "high", due_at: "2025-11-10T17:00:00Z", status: "open" },
  { id: "t2", title: "Return expireds", priority: "medium", due_at: "2025-11-12T17:00:00Z", status: "open" }
];
export async function GET(){ return NextResponse.json(demo); }
export async function POST(req:Request){ const b=await req.json(); demo.push({ id: "t"+(demo.length+1), ...b }); return NextResponse.json({ok:true}); }
