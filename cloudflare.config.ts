import { bindings, defineConfig, defineWorker } from "cf/config";
export default defineConfig({
  worker: defineWorker({
    name: "arevan",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-06",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv(),
    },
  }),
});
