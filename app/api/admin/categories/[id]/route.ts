import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const category = await db.category.findFirst({
    where: { id, restaurantId: session.restaurantId },
    include: { _count: { select: { menuItems: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category._count.menuItems > 0) {
    return NextResponse.json(
      { error: "Move or delete this category's items before deleting it" },
      { status: 400 },
    );
  }

  await db.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
