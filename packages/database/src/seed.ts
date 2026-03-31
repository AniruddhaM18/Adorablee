import "dotenv/config";
import { prisma } from "./client.js";

async function main() {
  // No default rows; create users via the app. Add prisma.*.createMany here if needed.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
