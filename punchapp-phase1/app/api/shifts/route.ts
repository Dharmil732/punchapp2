import { NextResponse } from "next/server";
const demo = [
  { id: "s1", start: "2025-11-10T15:00:00Z", end: "2025-11-10T23:00:00Z", store:"Dominion" }
];
export async function GET(){ return NextResponse.json(demo); }
