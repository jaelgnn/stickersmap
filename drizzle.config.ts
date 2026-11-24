import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error("TURSO_DATABASE_URL is missing from .env.local");
}

if (!authToken) {
  throw new Error("TURSO_AUTH_TOKEN is missing from .env.local");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl,
    authToken,
  },
});
