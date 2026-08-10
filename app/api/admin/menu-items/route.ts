import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

const createItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().positive(),
  isVeg: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await db.category.findMany({
    where: { restaurantId: session.restaurantId },
    orderBy: { sortOrder: "asc" },
    include: {
      menuItems: {
        orderBy: { name: "asc" },
      },
    },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid menu item data" }, { status: 400 });
  }

  const category = await db.category.findFirst({
    where: { id: parsed.data.categoryId, restaurantId: session.restaurantId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const item = await db.menuItem.create({
    data: {
      restaurantId: session.restaurantId,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      isVeg: parsed.data.isVeg ?? true,
      imageUrl: parsed.data.imageUrl ?? null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
