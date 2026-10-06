import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: pnpm admin:hash -- your-password");
  process.exit(1);
}
const salt = randomBytes(16);
const digest = scryptSync(password, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString("base64url")}$${digest.toString("hex")}`);
