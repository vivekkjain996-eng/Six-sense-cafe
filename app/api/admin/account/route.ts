import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

const updateAccountSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).optional().or(z.literal("")),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await db.adminUser.findUnique({
    where: { id: session.adminId },
    select: { name: true, email: true },
  });

  return NextResponse.json(admin);
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid name, email, and current password (new password needs 6+ characters)" },
      { status: 400 },
    );
  }

  const admin = await db.adminUser.findUnique({ where: { id: session.adminId } });
  if (!admin) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const passwordValid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  if (parsed.data.email !== admin.email) {
    const existing = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }
  }

  await db.adminUser.update({
    where: { id: session.adminId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      ...(parsed.data.newPassword ? { passwordHash: await hashPassword(parsed.data.newPassword) } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
