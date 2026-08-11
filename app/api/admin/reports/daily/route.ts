import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getEarningsReport, localDateString } from "@/lib/dailyReport";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role === "WAITER") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const today = localDateString(new Date());
  const fromStr = req.nextUrl.searchParams.get("from") ?? today;
  const toStr = req.nextUrl.searchParams.get("to") ?? fromStr;

  const report = await getEarningsReport(session.restaurantId, fromStr, toStr);
  return NextResponse.json(report);
}
