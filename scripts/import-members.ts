import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { parseMemberImportBuffer } from "../lib/member-import";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const csvArg = process.argv[2];
  if (!csvArg) {
    console.error("Usage: npm run db:import-members -- <path-to-file.csv|.xlsx>");
    console.error("Example: npm run db:import-members -- data/staff.xlsx");
    process.exit(1);
  }

  const filePath = resolve(csvArg);
  const buffer = readFileSync(filePath);
  const rows = parseMemberImportBuffer(buffer, filePath);

  for (const row of rows) {
    await prisma.member.create({ data: row });
    console.log(`Imported ${row.firstName} ${row.lastName}`);
  }

  console.log("");
  console.log(`Done. Imported ${rows.length} member(s).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
