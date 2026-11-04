// OpenNext Cloudflare adapter config for the isolated demo app. Its pages are
// fictional and static, so prerendered output is served from the Worker's
// static assets; nothing is written at runtime.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
