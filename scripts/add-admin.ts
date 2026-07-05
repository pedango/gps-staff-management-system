import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [, , email, name, password] = process.argv;

  if (!email || !name || !password) {
    console.error("Usage: npm run db:add-admin -- <email> <name> <password>");
    console.error('Example: npm run db:add-admin -- spo@gps.gov.gh "SPO Name" "YourPassword123"');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    create: {
      email,
      name,
      password: hash,
      role: "admin",
    },
    update: {
      name,
      password: hash,
    },
  });

  console.log(`Admin ready: ${admin.name} (${admin.email})`);
  console.log("Password stored as bcrypt hash (cost factor 12).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
