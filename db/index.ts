import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import postgres from "postgres";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
nextEnv.loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
const isLocalPostgres = databaseUrl ? (() => {
  try {
    const host = new URL(databaseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
})() : false;

// Neon uses an HTTP driver in production. A local Docker Postgres instance
// listens on TCP, so it needs the postgres-js driver instead.
export const db = databaseUrl
  ? isLocalPostgres
    ? drizzlePostgres(postgres(databaseUrl))
    : drizzle(neon(databaseUrl))
  : null;
