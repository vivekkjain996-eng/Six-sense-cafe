import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

const updateItemSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid menu item data" }, { status: 400 });
  }

  if (session.role === "WAITER" && Object.keys(body ?? {}).some((key) => key !== "isAvailable")) {
    return NextResponse.json({ error: "Staff can only mark items available or unavailable" }, { status: 403 });
  }

  const existing = await db.menuItem.findFirst({
    where: { id, restaurantId: session.restaurantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
  }

  if (parsed.data.categoryId) {
    const category = await db.category.findFirst({
      where: { id: parsed.data.categoryId, restaurantId: session.restaurantId },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }
  }

  const updated = await db.menuItem.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role === "WAITER") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await db.menuItem.findFirst({
    where: { id, restaurantId: session.restaurantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
  }

  try {
    await db.menuItem.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "This item has already been ordered — mark it unavailable instead of deleting it" },
        { status: 400 },
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
