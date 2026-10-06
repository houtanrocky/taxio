import nextEnv from "@next/env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
nextEnv.loadEnvConfig(process.cwd());
export const db = process.env.DATABASE_URL
  ? drizzle(postgres(process.env.DATABASE_URL, { prepare: true, max: 5, fetch_types: false }))
  : null;
