import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "arevan",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-06",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    // Add these to match the remote dashboard state
    workersDev: true,
    previewUrls: true,
    observability: {
      logs: {
        enabled: true, // Also changed this back to true to match the earlier remote state
      },
    },
    env: {
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv({
        id: "7a4c6d5da58b4e8cb0393ae3a0a092df",
      }),
    },
  }),
});
