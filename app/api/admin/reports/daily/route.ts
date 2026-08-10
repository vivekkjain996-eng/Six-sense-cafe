import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDailyReport, localDateString } from "@/lib/dailyReport";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const dateStr = dateParam ?? localDateString(new Date());

  const report = await getDailyReport(session.restaurantId, dateStr);
  return NextResponse.json(report);
}
