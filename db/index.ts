import "server-only";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const client = createClient({
  url: requireEnvironmentVariable("TURSO_DATABASE_URL"),
  authToken: requireEnvironmentVariable("TURSO_AUTH_TOKEN"),
});

export const db = drizzle({ client, schema });
