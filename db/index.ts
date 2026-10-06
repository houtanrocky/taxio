import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
nextEnv.loadEnvConfig(process.cwd());
export const db = process.env.DATABASE_URL
  ? drizzle(neon(process.env.DATABASE_URL))
  : null;
