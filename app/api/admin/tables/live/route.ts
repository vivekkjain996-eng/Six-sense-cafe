import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getLiveTables } from "@/lib/liveTables";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tables = await getLiveTables(session.restaurantId);
  return NextResponse.json(tables);
}
