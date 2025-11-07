import { NextResponse } from "next/server";
export async function GET(){
  const csv = "Employee,Date,Total Hours,Paid Hours\nAlice,2025-11-09,8.0,7.5\n";
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=report.csv" } });
}
