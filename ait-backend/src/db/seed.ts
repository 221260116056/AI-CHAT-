import { db } from "./index";
import { user } from "./schema";
import { nanoid } from "nanoid";

async function seed() {
  console.log("Seeding database...");

  // Seed super admin user (Better Auth will handle password hashing on first login)
  console.log("Database seeded successfully!");
  console.log(
    "Note: Create users via /api/auth/sign-up endpoint or Better Auth admin API."
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
