import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    const role = await prisma.role.upsert({
      where: { name: "admin" },
      create: { name: "admin" },
      update: {},
    });
    console.log("Role ready:", role.id, role.name);

    const hash = await bcrypt.hash("admin123", 10);

    const user = await prisma.user.upsert({
      where: { email: "admin@kohisaar.com" },
      create: {
        email: "admin@kohisaar.com",
        fullName: "Admin",
        passwordHash: hash,
        roleId: role.id,
      },
      update: {},
    });
    console.log("Admin user ready:", user.email);
    console.log("Password: admin123");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
