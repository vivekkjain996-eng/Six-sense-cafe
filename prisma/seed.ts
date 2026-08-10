import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const restaurant = await db.restaurant.create({
    data: { name: "Demo Restaurant", address: "123 Main St" },
  });

  await db.adminUser.create({
    data: {
      restaurantId: restaurant.id,
      name: "Owner",
      email: "owner@demo.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "OWNER",
    },
  });

  for (let tableNumber = 1; tableNumber <= 5; tableNumber++) {
    await db.restaurantTable.create({
      data: { restaurantId: restaurant.id, tableNumber },
    });
  }

  const starters = await db.category.create({
    data: { restaurantId: restaurant.id, name: "Starters", sortOrder: 1 },
  });
  const mainCourse = await db.category.create({
    data: { restaurantId: restaurant.id, name: "Main Course", sortOrder: 2 },
  });
  const beverages = await db.category.create({
    data: { restaurantId: restaurant.id, name: "Beverages", sortOrder: 3 },
  });

  await db.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        categoryId: starters.id,
        name: "Paneer Tikka",
        description: "Grilled cottage cheese with spices",
        price: 220,
        isVeg: true,
      },
      {
        restaurantId: restaurant.id,
        categoryId: mainCourse.id,
        name: "Butter Chicken",
        description: "Creamy tomato-based chicken curry",
        price: 320,
        isVeg: false,
      },
      {
        restaurantId: restaurant.id,
        categoryId: beverages.id,
        name: "Masala Chai",
        description: "Spiced Indian tea",
        price: 60,
        isVeg: true,
      },
    ],
  });

  console.log("Seeded restaurant, admin (owner@demo.com / password123), 5 tables, sample menu.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
