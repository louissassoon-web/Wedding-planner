import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("demo123", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@wedding.com" },
    update: {},
    create: {
      email: "demo@wedding.com",
      name: "Sarah & James",
      passwordHash: hashedPassword,
    },
  });

  console.log("Demo user created:", demoUser.email);

  const existingWedding = await prisma.wedding.findFirst({
    where: {
      members: {
        some: {
          userId: demoUser.id,
        },
      },
    },
  });

  if (!existingWedding) {
    const wedding = await prisma.wedding.create({
      data: {
        name: "Sarah & James Wedding",
        date: new Date("2026-06-15"),
        estimatedGuests: 100,
        currency: "GBP",
        members: {
          create: {
            userId: demoUser.id,
            role: "COUPLE",
            canViewSpend: true,
          },
        },
      },
    });

    console.log("Demo wedding created:", wedding.name);
  }

  console.log("\n✅ Seed completed!");
  console.log("\nDemo login credentials:");
  console.log("  Email: demo@wedding.com");
  console.log("  Password: demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
