import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Shared login used by all waiter staff on their phones — see app/waiter/login.
// Change WAITER_PASSWORD here and re-run `npm run create-waiter` to rotate it.
const WAITER_NAME = "Waiter";
const WAITER_EMAIL = "waiter@sixsensecafe.com";
const WAITER_PASSWORD = "sMdbACptfK7J";

async function main() {
  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) {
    throw new Error("No restaurant found — run `npm run seed` first.");
  }

  await db.adminUser.upsert({
    where: { email: WAITER_EMAIL },
    create: {
      restaurantId: restaurant.id,
      name: WAITER_NAME,
      email: WAITER_EMAIL,
      passwordHash: await bcrypt.hash(WAITER_PASSWORD, 10),
      role: "WAITER",
    },
    update: {
      passwordHash: await bcrypt.hash(WAITER_PASSWORD, 10),
      role: "WAITER",
    },
  });

  console.log(`Waiter account ready: ${WAITER_EMAIL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
