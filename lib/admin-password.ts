import { scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { existsSync, readFileSync } from "node:fs";
const scrypt = promisify(nodeScrypt);

export function getConfiguredAdminPasswordHash() {
  if (process.env.NODE_ENV !== "production" && existsSync(".env.local")) {
    const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find(value => value.trimStart().startsWith("ADMIN_PASSWORD_HASH="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return process.env.ADMIN_PASSWORD_HASH;
}

export async function verifyAdminPassword(password: string, encodedHash: string | undefined) {
  if (!encodedHash) return false;
  const normalizedHash = encodedHash.trim().replace(/^['"]|['"]$/g, "");
  const [algorithm, salt, digest] = normalizedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = (await scrypt(password, Buffer.from(salt, "base64url"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
