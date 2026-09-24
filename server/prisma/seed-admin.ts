import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@kohisaar.com";
  const adminPassword = "admin123";

  const role = await prisma.role.upsert({
    where: { name: "admin" },
    create: { name: "admin" },
    update: {},
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`Admin user already exists: ${adminEmail}`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      fullName: "Admin",
      phone: "03208198010",
      roleId: role.id,
    },
  });

  console.log("Admin user created successfully!");
  console.log("Email:", adminEmail);
  console.log("Password:", adminPassword);
  console.log("User ID:", user.id);

  await prisma.$disconnect();
}

void main();
