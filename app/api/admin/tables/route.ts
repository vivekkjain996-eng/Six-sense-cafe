import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

const createTableSchema = z.object({
  tableNumber: z.number().int().positive(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tables = await db.restaurantTable.findMany({
    where: { restaurantId: session.restaurantId },
    orderBy: { tableNumber: "asc" },
  });

  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "tableNumber must be a positive integer" }, { status: 400 });
  }

  const table = await db.restaurantTable.create({
    data: {
      restaurantId: session.restaurantId,
      tableNumber: parsed.data.tableNumber,
    },
  });

  return NextResponse.json(table, { status: 201 });
}
