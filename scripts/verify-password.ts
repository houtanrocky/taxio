import { loadEnvConfig } from "@next/env";
import { getConfiguredAdminPasswordHash, verifyAdminPassword } from "../lib/admin-password";
import { readFileSync, existsSync } from "node:fs";

loadEnvConfig(process.cwd());

function readEnvFileValue(fileName: string, key: string) {
  if (!existsSync(fileName)) return undefined;
  const line = readFileSync(fileName, "utf8").split(/\r?\n/).find(value => value.trimStart().startsWith(`${key}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
}
async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error("Usage: pnpm admin:verify -- your-password");
    process.exit(1);
  }
  const configuredHash = getConfiguredAdminPasswordHash();
  const valid = await verifyAdminPassword(password, configuredHash);
  const rawHash = configuredHash?.trim() ?? "";
  const hash = rawHash.replace(/^['"]|['"]$/g, "");
  const localHash = readEnvFileValue(".env.local", "ADMIN_PASSWORD_HASH") ?? "";
  const hashParts = hash.split("$");
  console.log(`HASH_FORMAT=${hashParts.length === 3 && hashParts[0] === "scrypt" ? "OK" : "INVALID"} HASH_LENGTH=${hash.length} FILE_HASH_LENGTH=${localHash.length} PASSWORD_LENGTH=${[...password].length} PASSWORD_CODEPOINTS=${[...password].map(character => character.codePointAt(0)?.toString(16)).join(",")}`);
  console.log(valid ? "ADMIN_PASSWORD_VALID" : "ADMIN_PASSWORD_INVALID");
  if (!valid) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
