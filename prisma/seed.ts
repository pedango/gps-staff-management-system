import { config as loadEnv } from "dotenv";

// Prisma CLI reads `.env` only; Next.js reads `.env.local`. Load both for `tsx prisma/seed.ts`.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!123";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@gps.gov.gh";
  const hash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    create: {
      email,
      name: "GPS — System Administrator",
      password: hash,
      role: "admin",
    },
    update: {
      password: hash,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
