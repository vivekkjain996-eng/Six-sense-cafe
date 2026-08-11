import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

const createCategorySchema = z.object({
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role === "WAITER") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  const maxSort = await db.category.aggregate({
    where: { restaurantId: session.restaurantId },
    _max: { sortOrder: true },
  });

  const category = await db.category.create({
    data: {
      restaurantId: session.restaurantId,
      name: parsed.data.name,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
