import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
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

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint: Forbidden non-null assertion.
    url: process.env.POSTGRES_URL!,
  },
});
