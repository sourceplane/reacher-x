// OpenNext Cloudflare adapter config for the main app.
//
// "use cache" entries and prerendered pages live in Workers KV
// (NEXT_INC_CACHE_KV, one namespace per environment from
// infra/terraform/cloudflare-kv). Stale entries are refreshed in the
// background by a Durable Object queue (NEXT_CACHE_DO_QUEUE) that calls the
// Worker back through WORKER_SELF_REFERENCE. No code calls revalidateTag, so
// there is no tag cache.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: doQueue,
});
