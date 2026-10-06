import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const workersCache = await createWorkersCacheConfig();

export default defineConfig({
  worker: defineWorker({
    ...workersCache,
    name: "arevan",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-06",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ...workersCache.env,
      ASSETS: bindings.assets(),
    },
    exports: {
      ...workersCache.exports,
    },
  }),
});
