# reacher-x-on-orunbase: design

## 1. What moves and what does not

ReacherX has three deployables. Only two of them ran on Vercel.

| Part                                          | On Vercel                                        | After this epic                                                                                               |
| --------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Main Next.js app (repo root)                  | Vercel project `reacher-x-v3`                    | Worker `reacher-x-web-<env>`, component `web` (`reacherx-worker`, repo-local)                                 |
| Demo app (`demos/app`)                        | Vercel project `reacherx-demos`                  | Worker `reacher-x-demo-<env>`, component `demo` (`cloudflare-workers-assets-turbo`)                           |
| Convex backend (`convex/`)                    | Convex Cloud, deployed by the main build command | Convex Cloud, unchanged; deployed by component `backend` (`convex-deploy`, repo-local) once its key is stored |
| Crons, workflows, webhooks, file storage, RAG | Convex                                           | Convex, unchanged                                                                                             |
| Auth (WorkOS AuthKit), billing (Polar), email | WorkOS, Polar via Convex, Resend via Convex      | unchanged; only callback URLs follow the domain                                                               |

Nothing in `convex/` changes. The port is the hosting layer of the two
Next.js apps, plus what Workers force on their code (section 4).

## 2. Runtime shape

```
browser ── reacher-x-web-<env> (Worker + static assets) ── Convex Cloud (queries, actions, webhooks)
   │            │  NEXT_INC_CACHE_KV  (Workers KV: "use cache" entries, route cache)
   │            │  NEXT_CACHE_DO_QUEUE (Durable Object: background revalidation)
   │            │  IMAGES             (Cloudflare Images: next/image)
   │            └─ WorkOS AuthKit in proxy.ts (Node middleware on OpenNext)
   └─ iframe ── reacher-x-demo-<env> (Worker + static assets, prerendered pages in assets)
```

- Both Workers are built by `@opennextjs/cloudflare` from `next build`
  standalone output (`pnpm build:worker`, `pnpm build:demo:worker`).
- Per-environment Worker config is rendered from `wrangler.template.jsonc`
  by `tooling/wire`: from `wiring.fixture.json` in local runs and verify
  lanes, from the `cloudflare-kv` root's wiring document in deploy lanes.
- `WORKOS_COOKIE_PASSWORD` is a Worker secret. Orun resolves it from the
  workspace and writes it into the deployed Worker after each deploy (the
  `materialize` block of the `reacherx-worker` deploy profile). It never
  passes through git, a file, or a log.
- `WORKOS_CLIENT_ID` is public and lives in the Worker's `vars` as
  `client_unconfigured` until WorkOS is connected.

## 3. Orun structure

| Orun piece                  | Where                                            | What it does                                                                                 |
| --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Workspace                   | ReacherX (`ws_08AC9DT1`), account openproduct    | the repo's tenancy; Cloudflare connection inherited from the account                         |
| `intent.yaml`               | repo root                                        | environments, composition sources, the four components (declared inline, so no folder moves) |
| `cloudflare-kv` (terraform) | `infra/terraform/cloudflare-kv`                  | one KV namespace per environment for the Next.js cache; publishes `WIRING_CLOUDFLARE_KV`     |
| `backend` (convex-deploy)   | `infra/stack/compositions/convex-deploy`         | verify: the backend is present; deploy: `convex deploy` when `CONVEX_DEPLOY_KEY` is stored   |
| `demo`                      | stack-tectonic `cloudflare-workers-assets-turbo` | build, dry-run, deploy and smoke the demo Worker                                             |
| `web` (reacherx-worker)     | `infra/stack/compositions/reacherx-worker`       | the same pipeline plus secret delivery into the Worker                                       |
| CI                          | `.github/workflows/orun.yml`                     | plan, then one GitHub job per lane; off until the `ORUN_CI` repository variable is `true`    |
| Merge gate                  | `.github/workflows/ci.yml` (upstream)            | typecheck, lint, format, Convex tests, unchanged                                             |

Environments: `stage` plans and verifies on every pull request and deploys
on every merge to `main`; `prod` is planned only on `main` and deploys
after stage converges on the same commit. There is no per-PR preview
environment (section 6).

Secrets, all resolved by Orun at run time and never stored in GitHub:

| Secret                   | Kind                                                     | Used by                            |
| ------------------------ | -------------------------------------------------------- | ---------------------------------- |
| `CLOUDFLARE_API_TOKEN`   | brokered from the Cloudflare connection (workers-deploy) | Terraform, wrangler deploys        |
| `CLOUDFLARE_ACCOUNT_ID`  | brokered (account-id)                                    | Terraform, wrangler deploys        |
| `WORKOS_COOKIE_PASSWORD` | static, 48 random bytes                                  | written into `reacher-x-web-<env>` |
| `WIRING_CLOUDFLARE_KV`   | published by the `cloudflare-kv` apply                   | the web deploy's wrangler config   |
| `CONVEX_DEPLOY_KEY`      | static, optional: the backend deploy skips without it    | `backend`                          |

## 4. What Workers force on the code

1. **Next.js 16.4.** `@opennextjs/cloudflare` 1.20.12 and later require
   Next 16.4.1 or newer; the app moves from 16.2.9 to 16.4.4.
2. **Cache Components off, `"use cache"` kept.** `cacheComponents: true`
   makes requests fail or hang on Workers (opennextjs-cloudflare#1450,
   open). `experimental.useCache: true` keeps every `"use cache"`,
   `cacheLife` and `cacheTag` call working; partial prerendering is lost
   until the issue is fixed.
3. **No filesystem at request time.** The blog posts, the blog example and
   the Open Graph font were read from disk on each request.
   `scripts/generate-server-content.mjs` bundles them into a git-ignored
   module on install, `dev` and `build`; `getBlogPosts`, the example page
   and `ogImageCore` read that module.
4. **Worker size (10 MB compressed).** Two browser-only libraries reached
   the server bundle through client components rendered on the server:
   full Shiki (every grammar, about 9 MB) and the X chat SDK
   (`@xdevplatform/chat-xdk`, about 4 MB of WebAssembly).
   `next.config.mjs` aliases `browserShiki.ts` and `xChatSdk.ts` to
   stand-ins for server builds only, and blog highlighting uses Shiki's
   fine-grained core with the languages the blog needs.
5. **Bundling.** `@opennextjs/cloudflare` gets its own esbuild 0.28 through
   `packageExtensions` (pnpm otherwise hands it Convex's 0.27), and the
   Worker is bundled with `--noMinify` because esbuild's syntax minifier
   panics on one Turbopack chunk. The demo's standalone output is filled in
   by `tooling/opennext/fill-standalone.mjs` (Next leaves out chunks for
   nested apps).
6. **Vercel-only packages.** `@vercel/analytics` and `@vercel/speed-insights`
   are removed (PostHog stays). `outputFileTracingIncludes` is gone with the
   font read.

## 5. Out of scope

- Moving any Convex code, data or provider integration.
- A Convex deployment, WorkOS app, Polar and provider accounts for stage
  and prod: the founder's to connect (README, "Finish the cut-over").
- Moving `reacherx.com`: its DNS is at GoDaddy and points at Vercel. The
  cut-over is: zone to Cloudflare, a `cloudflare-domain` component for
  `reacherx.com` and `www`, callback URLs at WorkOS and X.

## 6. The alternative not taken

**Rebuild on a baseline (cirrus or lumen).** Both are multi-tenant SaaS
starters whose value is their backend: identity, organizations, billing,
metering on D1 or Supabase. ReacherX already has each of those in WorkOS,
Polar and about 200,000 lines of Convex. Building on a baseline means two
backends or a rewrite. The conventions (lanes, wiring tokens, the task
pen) are reused; the backend is not.

**Per-PR preview deployments** (what Vercel gave) are not part of the
first release: stage is the shared pre-production environment.
