# Cloudflare Workers deployment

Arevan keeps the normal Next.js + Docker deployment path for portability. Cloudflare is an additional deployment target and should not be used as the local database host.

## 1. Install the Cloudflare toolchain

```bash
pnpm add -Dw vinext vite @vitejs/plugin-react @vitejs/plugin-rsc @cloudflare/vite-plugin@beta cf wrangler
pnpm add -w @vinext/cloudflare react-server-dom-webpack
pnpm exec vinext init --platform=cloudflare
```

If `vinext init` offers Workers Response Store or Cloudflare Images, choose no for both. This configuration uses Workers Cache and does not require R2 or a billing method.

## 2. Prepare production PostgreSQL

The local Docker database at `localhost:5435` cannot be reached by a Cloudflare Worker. Use hosted PostgreSQL such as Neon, run migrations, and seed it once:

```powershell
$env:DATABASE_URL="postgresql://..."
pnpm db:migrate
pnpm db:seed
```

Do not commit this URL. Cloudflare Workers can use the existing `postgres` driver with Node.js compatibility enabled.

## 3. First deployment

Build and deploy the app normally. Workers Cache is created as part of the app Worker; no auxiliary Worker or R2 bucket is needed.

```bash
pnpm run build:vinext
pnpm run deploy:vinext
```

This creates the `arevan` Worker.

## 4. Set production secrets

This project uses `cloudflare.config.ts`, so Wrangler needs the explicit Worker name:

```powershell
pnpm exec wrangler secret put DATABASE_URL --name arevan
pnpm exec wrangler secret put ADMIN_PASSWORD_HASH --name arevan
pnpm exec wrangler secret put ADMIN_SESSION_SECRET --name arevan
```

Enter the hosted database URL and secret values when prompted. Generate new production admin credentials; do not reuse `.env.local` values.

Set `NEXT_PUBLIC_APP_URL` to the real public URL in the Cloudflare Worker configuration before the next build/deploy. Do not use a localhost URL in production metadata.

## 5. Subsequent deployments

After the first successful release, staged cache warming can be enabled:

```bash
pnpm run deploy:vinext:warm
```

## 6. Local Worker testing

```bash
pnpm run build:vinext
pnpm exec cf dev
```

## 7. Verify production

Check the homepage, an article, `/sitemap.xml`, `/robots.txt`, and `/admin/login`. Log in, publish a draft, and confirm the article appears publicly.
