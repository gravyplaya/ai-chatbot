import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { existsSync } from "fs";

// Load environment variables from multiple possible files
const envFiles = [".env.local", ".env.development", ".env.production", ".env"];
for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    config({ path: envFile });
    break;
  }
}

// If not found, try the default (current behavior)
if (!process.env.POSTGRES_URL) {
  config();
}

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    console.warn("POSTGRES_URL is not defined, skipping migration.");
    process.exit(0);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("⏳ Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
