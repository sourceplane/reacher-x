# reacher-x-on-orunbase (RX): implementation status

As-built is not intent. This file records what actually shipped, and every
place the code departed from `design.md` or from upstream.

| Milestone                   | State | PR                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RX0 the spec                | done  | [#1](https://github.com/sourceplane/reacher-x/pull/1)                                                                                                                                                                                                                                                                                                                                               |
| RX1 the apps run on Workers | done  | [#4](https://github.com/sourceplane/reacher-x/pull/4)                                                                                                                                                                                                                                                                                                                                               |
| RX2 Orun runs it            | done  | [#3](https://github.com/sourceplane/reacher-x/pull/3)                                                                                                                                                                                                                                                                                                                                               |
| RX3 live on stage and prod  | done  | [#5](https://github.com/sourceplane/reacher-x/pull/5), [#6](https://github.com/sourceplane/reacher-x/pull/6), [#7](https://github.com/sourceplane/reacher-x/pull/7), [#8](https://github.com/sourceplane/reacher-x/pull/8), [#9](https://github.com/sourceplane/reacher-x/pull/9), [#10](https://github.com/sourceplane/reacher-x/pull/10), [#11](https://github.com/sourceplane/reacher-x/pull/11) |
| RX4 ready to hand over      | done  | [#12](https://github.com/sourceplane/reacher-x/pull/12)                                                                                                                                                                                                                                                                                                                                             |

## RX1 as built

Measured with `wrangler deploy --dry-run` on 2026-11-04:

| Worker          | Upload  | Compressed |
| --------------- | ------- | ---------- |
| main app (web)  | 41.1 MB | 9.39 MB    |
| demo app (demo) | 40.1 MB | 8.95 MB    |

The first main-app build was 13.5 MB compressed. Full Shiki (1.6 MB
compressed) and the X chat SDK's WebAssembly (2.3 MB compressed, shipped
twice) came in through client components rendered on the server.

Verified on workerd (`wrangler dev`): `/` redirects to `/home`; `/home`,
`/pricing`, `/blog`, a post with highlighted code, both OG image routes,
`llms.txt`, `sitemap.xml`, `robots.txt`, the feed and the markdown routes
answer 200; `/login`, `/signup` and `/agent` redirect to WorkOS with a
sealed PKCE state. `"use cache"` entries land in the KV namespace. The demo
serves `/`, `/agent`, `/agent/setup`, `/agent-ops`, `/analytics`,
`/notifications`, `/archives`, `/plans`, `/usage` and `/settings` from its
prerendered assets.

## RX2 as built

`orun plan` resolves four components in two environments. On a pull
request: `cloudflare-kv` plan-only, `backend`, `demo` and `web` verify, in
stage only. On `main`: `cloudflare-kv` apply, `backend` deploy (skipped
until `CONVEX_DEPLOY_KEY` exists), `demo` and `web` deploy with smoke
checks, stage first, then prod. `web` writes `WORKOS_COOKIE_PASSWORD` into
its Worker after each deploy (`materialize`, target `cloudflare-worker`).
`.github/workflows/orun.yml` runs only when `ORUN_CI` is `true`; CI pins
orun v2.78.4 and stack-tectonic 0.20.0, the versions the baselines run.

## RX3 as built

Live since 2026-11-04 from `main` through Orun (run `0JGY6DXWC0BNHYFCXQQR2JRA13`
and later), Cloudflare account Rahulvarghesepullely@gmail.com's Account,
Workers Paid (a 9 MB Worker was accepted):

| Environment | Main app                                                     | Demo                                                          |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| stage       | https://reacher-x-web-stage.rahulvarghesepullely.workers.dev | https://reacher-x-demo-stage.rahulvarghesepullely.workers.dev |
| prod        | https://reacher-x-web-prod.rahulvarghesepullely.workers.dev  | https://reacher-x-demo-prod.rahulvarghesepullely.workers.dev  |

Checked live in both environments: 12 of 12 main-app routes answer 200
(`/home`, `/pricing`, `/blog`, a post with highlighted code, three OG
images, `llms.txt`, `sitemap.xml`, `robots.txt`, the feed, the markdown
route); `/` redirects to `/home`; `/login` and `/agent` redirect to WorkOS;
the demo answers 200 on all 10 of its routes and allows framing only by its
own environment's main app. A browser load of `/home` shows no script
errors from the port; the remaining console errors are the expected missing
Convex deployment and PostHog key, and the demo's deliberately offline
Convex client.

Main Worker after `keep_names: false`: 9.15 MB compressed. The `backend`
job runs on every change to `convex/` and reports the deploy skipped until
`CONVEX_DEPLOY_KEY` is stored.

Fixes the first live deploys needed, one task each: #6 source maps over
60 MiB, #7 and #8 secret delivery (see below), #9 smoke checks under
`pipefail`, #10 `__name` in inlined scripts, #11 GitHub star count.

## Departures from upstream

- Next.js 16.2.9 to 16.4.4 (with `@next/mdx` and `eslint-config-next`):
  `@opennextjs/cloudflare` 1.20.12 and later require 16.4.1 or newer.
- `cacheComponents: true` replaced by `experimental.useCache: true`
  (opennextjs-cloudflare#1450). Partial prerendering is off.
- `output: "standalone"` in both Next configs (OpenNext bundles it).
- Blog sources, the blog example and the Open Graph font come from
  `shared/lib/generated/serverContent.ts`, generated by
  `scripts/generate-server-content.mjs` on install, `dev` and `build`,
  instead of `node:fs` at request time. `outputFileTracingIncludes` is gone.
- Blog code highlighting uses Shiki's core with the JavaScript regex engine
  and eleven languages (`shared/lib/highlight/blogHighlighter.ts`); other
  languages render as plain text.
- `CodeBlock` (client) imports Shiki through `browserShiki.ts`, and
  `xChatBrowserSession` imports the X chat SDK through `xChatSdk.ts`; server
  builds alias both to stand-ins (`turbopack.resolveAlias`, both apps).
- `@vercel/analytics` and `@vercel/speed-insights` removed (PostHog stays).
- `pnpm-workspace.yaml`: `workerd` may run its install script, and
  `@opennextjs/cloudflare` gets its own esbuild 0.28 (`packageExtensions`).
- The Worker bundle is not minified (`--noMinify`): esbuild's syntax
  minifier panics on one Turbopack chunk.
- The demo build fills in its standalone server output
  (`tooling/opennext/fill-standalone.mjs`) and copies its prerendered pages
  into the Worker's assets (`populateCache local`).
- `WORKOS_CLIENT_ID` is a Worker variable, `client_unconfigured` until
  WorkOS is connected.
- `getGitHubStars` sends a `User-Agent` (GitHub answers 403 without one,
  and Workers do not add it).
- Both Worker configs set `upload_source_maps: false` and
  `keep_names: false`.
- `vercel.json` and `demos/app/vercel.json` are gone; `docs/configuration.md`
  describes the Workers setup instead of the Vercel one.

## Departures from the design

- **Worker secrets are written by a deploy step, not Orun's `materialize`.**
  orun builds the `cloudflare-worker` materialize adapter from the `orun run`
  process environment, and CI brokers the Cloudflare token into each job, so
  no adapter is wired ("no materialize adapters are configured"). The
  repo-local `reacherx-worker` composition has a `worker-secrets` step after
  `deploy` that pipes the component's `workerSecrets` as JSON on stdin to
  `wrangler secret bulk` (#8). Worth fixing in orun: build the adapter from
  the job's resolved secrets.
- **The demo uses the repo-local composition too** (`deploy-static`), because
  stack-tectonic's structure check expects a `package.json` and a committed
  `wrangler.jsonc` in the component's own directory (#5).
- **Lane jobs run in the checkout** (`orun run --isolation none`). A staged
  job tree links `node_modules` back to the checkout, which Turbopack refuses
  as outside its root, and Next's instrumentation trace goes missing (#5).
- **`change.inputs` on `web`, `demo` and `backend`.** A component at the
  repository root owns no files under `--changed`, and the demo reuses the
  root's code (#5). Pull request plans create the local base branch first so
  orun can read the base `intent.yaml` (#5).
- **No source maps are uploaded** (`upload_source_maps: false`): both apps'
  maps exceed Cloudflare's 60 MiB per Worker (#6).
- **Smoke checks match with a here-string**: under `pipefail` a `grep -q`
  pipe fails with SIGPIPE on pages larger than a pipe buffer (#9).
- **Tasks read `ready`, not `done`, in Orunbase.** The openproduct account's
  GitHub connection is the `pullely` installation, so Orunbase does not see
  this repository's pull request events, and no `orun/compliance` check ran.
  CI runs do reach the workspace (GitHub OIDC). Connecting the sourceplane
  GitHub installation to the account would fix it.
