import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Real production data for Six Sense Cafe & Restaurant. Table QR tokens are
// preserved exactly from the original setup so any already-printed QR codes
// for tables 1-5 keep working after moving to this database.
const RESTAURANT = {
  name: "Six Sense Cafe & Restaurant",
  address: "123 Main St",
  phone: "+91 7014262227",
};

const ADMIN_EMAIL = "owner@sixsensecafe.com";
const ADMIN_PASSWORD = "Garnet7543#";

const TABLES = [
  { tableNumber: 1, qrToken: "feb0717b-6f1e-4641-8c95-e0513715c445" },
  { tableNumber: 2, qrToken: "8274eba9-5708-4f25-acc7-5c479f5c988e" },
  { tableNumber: 3, qrToken: "9349bf46-8a51-4911-8036-40d8eedf8fb4" },
  { tableNumber: 4, qrToken: "5490bff1-a626-4a09-afaf-da411dac21d0" },
  { tableNumber: 5, qrToken: "ec653a37-e22d-481f-9229-bc549bf7a812" },
];

const CATEGORIES: { name: string; sortOrder: number; items: { name: string; description: string | null; price: number; isVeg: boolean }[] }[] = [
  { name: "Beverages", sortOrder: 1, items: [
    { name: "Black Tea", description: null, price: 36, isVeg: true },
    { name: "Blue Lagoon Mojito", description: null, price: 196, isVeg: true },
    { name: "Cold Coffee", description: null, price: 126, isVeg: true },
    { name: "Cold Coffee + Ice Cream", description: null, price: 156, isVeg: true },
    { name: "Cold Drink", description: null, price: 86, isVeg: true },
    { name: "Hot Coffee", description: null, price: 66, isVeg: true },
    { name: "Ice Tea", description: null, price: 96, isVeg: true },
    { name: "Lemon Tea", description: null, price: 46, isVeg: true },
    { name: "Lime Water Juice", description: null, price: 56, isVeg: true },
    { name: "Lime Water with Soda", description: null, price: 76, isVeg: true },
    { name: "Masala Tea", description: null, price: 46, isVeg: true },
    { name: "Mineral Water", description: null, price: 36, isVeg: true },
    { name: "Redbull", description: null, price: 226, isVeg: true },
    { name: "Soda", description: null, price: 46, isVeg: true },
    { name: "Virgin Mojito", description: null, price: 196, isVeg: true },
  ]},
  { name: "Shakes", sortOrder: 2, items: [
    { name: "Pineapple", description: null, price: 146, isVeg: true },
    { name: "Rose Faluda", description: null, price: 156, isVeg: true },
    { name: "Strawberry", description: null, price: 136, isVeg: true },
  ]},
  { name: "Snacks", sortOrder: 3, items: [
    { name: "Chana Chat Masala", description: null, price: 196, isVeg: true },
    { name: "Cheese Balls", description: null, price: 256, isVeg: true },
    { name: "Cheese Masala Papad", description: null, price: 96, isVeg: true },
    { name: "Cheese Nugets", description: null, price: 226, isVeg: true },
    { name: "Corn Chat", description: null, price: 166, isVeg: true },
    { name: "Crispy Corn", description: null, price: 186, isVeg: true },
    { name: "French Fries", description: null, price: 166, isVeg: true },
    { name: "Hara Bhara Kabab", description: null, price: 256, isVeg: true },
    { name: "Khicha Papad (Fry)", description: null, price: 36, isVeg: true },
    { name: "Khicha Papad (Roasted)", description: null, price: 46, isVeg: true },
    { name: "Onion Rings", description: null, price: 266, isVeg: true },
    { name: "Paneer Pakode", description: null, price: 196, isVeg: true },
    { name: "Papad Fry", description: null, price: 36, isVeg: true },
    { name: "Papad Masala", description: null, price: 56, isVeg: true },
    { name: "Papad Roasted", description: null, price: 26, isVeg: true },
    { name: "Peanut Masala", description: null, price: 176, isVeg: true },
    { name: "Peri Peri Fries", description: null, price: 186, isVeg: true },
    { name: "Tandoori Cheese Nachos", description: null, price: 226, isVeg: true },
    { name: "Tandoori Garlic Fries", description: null, price: 226, isVeg: true },
    { name: "Veg. Pakoda", description: null, price: 156, isVeg: true },
  ]},
  { name: "Chinese", sortOrder: 4, items: [
    { name: "Chow Mein", description: null, price: 176, isVeg: true },
    { name: "Fried Rice", description: null, price: 176, isVeg: true },
    { name: "Hakka Noodles", description: null, price: 186, isVeg: true },
    { name: "Honey Chilli Potato", description: null, price: 246, isVeg: true },
    { name: "Manchurian (Dry or Gravy)", description: null, price: 236, isVeg: true },
    { name: "Manchurian Fried Rice", description: null, price: 236, isVeg: true },
    { name: "Paneer Chilli", description: null, price: 246, isVeg: true },
    { name: "Potato Chilli", description: null, price: 226, isVeg: true },
    { name: "Schezwan Fried Rice", description: null, price: 186, isVeg: true },
    { name: "Schezwan Noodles", description: null, price: 206, isVeg: true },
  ]},
  { name: "Maggie", sortOrder: 5, items: [
    { name: "Cheese Maggie", description: null, price: 136, isVeg: true },
    { name: "Masala Maggie", description: null, price: 106, isVeg: true },
    { name: "Plain Maggie", description: null, price: 96, isVeg: true },
    { name: "Veg. Cheese Maggie", description: null, price: 156, isVeg: true },
    { name: "Veg. Maggie", description: null, price: 146, isVeg: true },
  ]},
  { name: "Sandwiches", sortOrder: 6, items: [
    { name: "6 Sense Special Sandwich", description: null, price: 286, isVeg: true },
    { name: "Jumbo Club Sandwich", description: null, price: 246, isVeg: true },
    { name: "Veg. Cheese Sandwich", description: null, price: 166, isVeg: true },
    { name: "Veg. Sandwich", description: null, price: 126, isVeg: true },
  ]},
  { name: "Pizza", sortOrder: 7, items: [
    { name: "6 Sense Special Pizza", description: null, price: 356, isVeg: true },
    { name: "Cheese Pizza", description: null, price: 186, isVeg: true },
    { name: "Corn Pizza", description: null, price: 196, isVeg: true },
    { name: "Onion Pizza", description: null, price: 196, isVeg: true },
    { name: "Paneer Corn Pizza", description: null, price: 286, isVeg: true },
    { name: "Tandoori Paneer Corn Pizza", description: null, price: 326, isVeg: true },
    { name: "Tomato Pizza", description: null, price: 196, isVeg: true },
    { name: "Veg. Cheese Pizza", description: null, price: 246, isVeg: true },
  ]},
  { name: "Pasta", sortOrder: 8, items: [
    { name: "Italian Pasta", description: null, price: 296, isVeg: true },
    { name: "Red Sauce Pasta", description: null, price: 246, isVeg: true },
    { name: "White Sauce Pasta", description: null, price: 276, isVeg: true },
  ]},
  { name: "Main Course", sortOrder: 9, items: [
    { name: "Butter Paneer", description: null, price: 296, isVeg: true },
    { name: "Dal Fry", description: null, price: 176, isVeg: true },
    { name: "Dal Tadka", description: null, price: 196, isVeg: true },
    { name: "Kadai Paneer", description: null, price: 286, isVeg: true },
    { name: "Matar Paneer", description: null, price: 256, isVeg: true },
    { name: "Paneer Bhurji", description: null, price: 196, isVeg: true },
    { name: "Paneer Lababdar", description: null, price: 296, isVeg: true },
    { name: "Sev Tamatar", description: null, price: 186, isVeg: true },
  ]},
  { name: "Chapati", sortOrder: 10, items: [
    { name: "Aloo + Onion Paratha", description: null, price: 126, isVeg: true },
    { name: "Aloo Paratha", description: null, price: 106, isVeg: true },
    { name: "Butter Roti", description: null, price: 26, isVeg: true },
    { name: "Onion Paratha", description: null, price: 96, isVeg: true },
    { name: "Paneer Paratha", description: null, price: 146, isVeg: true },
    { name: "Plain Paratha", description: null, price: 36, isVeg: true },
    { name: "Plain Roti", description: null, price: 16, isVeg: true },
  ]},
  { name: "Rice", sortOrder: 11, items: [
    { name: "Jeera Rice", description: null, price: 126, isVeg: true },
    { name: "Paneer Pulao", description: null, price: 176, isVeg: true },
    { name: "Plain Rice", description: null, price: 96, isVeg: true },
  ]},
  { name: "Salad", sortOrder: 12, items: [
    { name: "Green Salad", description: null, price: 86, isVeg: true },
    { name: "Salad", description: null, price: 56, isVeg: true },
  ]},
  { name: "Raita", sortOrder: 13, items: [
    { name: "Butter Milk", description: null, price: 56, isVeg: true },
    { name: "Curd", description: null, price: 56, isVeg: true },
    { name: "Onion Raita", description: null, price: 96, isVeg: true },
    { name: "Veg Raita", description: null, price: 86, isVeg: true },
  ]},
  { name: "Dessert", sortOrder: 14, items: [
    { name: "Chocolate", description: null, price: 86, isVeg: true },
    { name: "Vanilla", description: null, price: 56, isVeg: true },
  ]},
  { name: "Beer", sortOrder: 15, items: [
    { name: "Budweiser Magnum (500ML)", description: null, price: 456, isVeg: true },
    { name: "Carlsberg Elephant (500ML)", description: null, price: 456, isVeg: true },
    { name: "Kingfisher Ultra (500ML)", description: null, price: 386, isVeg: true },
    { name: "Turborg (750ML)", description: null, price: 356, isVeg: true },
  ]},
  { name: "Whisky", sortOrder: 16, items: [
    { name: "Ballantine's (60ML)", description: null, price: 456, isVeg: true },
    { name: "Blenders Pride (60ML)", description: null, price: 356, isVeg: true },
    { name: "Dewars White (60ML)", description: null, price: 456, isVeg: true },
    { name: "Jameson Irish (60ML)", description: null, price: 506, isVeg: true },
    { name: "Red Label (60ML)", description: null, price: 456, isVeg: true },
    { name: "Teachers (60ML)", description: null, price: 456, isVeg: true },
  ]},
  { name: "Rum", sortOrder: 17, items: [
    { name: "Bacardi Lemon White (60ML)", description: null, price: 406, isVeg: true },
    { name: "Old Monk (30ML)", description: null, price: 156, isVeg: true },
    { name: "Old Monk (60ML)", description: null, price: 226, isVeg: true },
  ]},
  { name: "Vodka", sortOrder: 18, items: [
    { name: "Absolute Vodka (60ML)", description: null, price: 486, isVeg: true },
    { name: "Green Apple (30ML)", description: null, price: 196, isVeg: true },
    { name: "Green Apple (60ML)", description: null, price: 286, isVeg: true },
  ]},
  { name: "Breezers", sortOrder: 19, items: [
    { name: "Bacardi Cranberry", description: null, price: 256, isVeg: true },
    { name: "Bacardi Lemonade", description: null, price: 256, isVeg: true },
  ]},
  { name: "Shots & Gin", sortOrder: 20, items: [
    { name: "Bombay Sapphire", description: null, price: 456, isVeg: true },
    { name: "Tequila Shots", description: null, price: 506, isVeg: true },
  ]},
  { name: "Elite Drink Mix", sortOrder: 21, items: [
    { name: "Elite Mix Cranberry", description: "Gin + Vodka + Tequila + White Rum (30ml each) + Juice + Soda + Burnt Lemon + Mint + Sprite", price: 1056, isVeg: true },
    { name: "Elite Mix Orange", description: "Gin + Vodka + Tequila + White Rum (30ml each) + Juice + Soda + Burnt Lemon + Mint + Sprite", price: 1056, isVeg: true },
  ]},
  { name: "Other Mixes", sortOrder: 22, items: [
    { name: "Juice (Cranberry or Orange)", description: null, price: 106, isVeg: true },
    { name: "Soda", description: null, price: 46, isVeg: true },
    { name: "Tonic Water", description: null, price: 156, isVeg: true },
  ]},
  { name: "Shisha", sortOrder: 23, items: [
    { name: "Classic Mixes (Light Flavours)", description: null, price: 1200, isVeg: true },
    { name: "Exotic Mixes (Medium/Strong)", description: null, price: 1400, isVeg: true },
    { name: "Premium Pot", description: null, price: 1700, isVeg: true },
  ]},
];

async function main() {
  const restaurant = await db.restaurant.create({ data: RESTAURANT });

  await db.adminUser.create({
    data: {
      restaurantId: restaurant.id,
      name: "Owner",
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "OWNER",
    },
  });

  for (const table of TABLES) {
    await db.restaurantTable.create({
      data: { restaurantId: restaurant.id, tableNumber: table.tableNumber, qrToken: table.qrToken },
    });
  }

  for (const category of CATEGORIES) {
    const created = await db.category.create({
      data: { restaurantId: restaurant.id, name: category.name, sortOrder: category.sortOrder },
    });
    for (const item of category.items) {
      await db.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: created.id,
          name: item.name,
          description: item.description,
          price: item.price,
          isVeg: item.isVeg,
          isAvailable: true,
        },
      });
    }
  }

  const totalItems = CATEGORIES.reduce((n, c) => n + c.items.length, 0);
  console.log(
    `Seeded ${restaurant.name}: ${TABLES.length} tables, ${CATEGORIES.length} categories, ${totalItems} items. Admin login: ${ADMIN_EMAIL}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
