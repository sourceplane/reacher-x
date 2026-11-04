# reacher-x-on-orunbase: implementation plan

One task per milestone. Each lands as one pull request on an
`orun/RX-<n>-<slug>` branch with `Orun-Task: RX-<n>` on every commit.

## RX0 the spec (RX-1)

Done when:

- this doc set and the five task contracts are on `main`

## RX1 the apps run on Workers (RX-2)

Done when:

- `pnpm build:worker` and `pnpm build:demo:worker` produce `.open-next/worker.js` for both apps
- `wrangler deploy --dry-run` reports each Worker under 10 MB compressed
- `wrangler dev` serves `/home`, `/pricing`, `/blog`, a post, the OG images, `llms.txt`, the sitemap and the feed with 200, redirects `/` to `/home` and `/login` to WorkOS, and the demo serves `/agent`
- the upstream checks (typecheck, `lint:strict`, prettier on changed files, `test:convex`) stay green

## RX2 Orun runs it (RX-3)

Done when:

- `intent.yaml` declares the workspace, both composition sources and the `cloudflare-kv`, `backend`, `demo` and `web` components
- `orun plan` resolves locally: stage on a pull request, stage and prod on `main`
- `.github/workflows/orun.yml` is on `main` and runs only when the `ORUN_CI` repository variable is `true`

## RX3 live on stage and prod (RX-4)

Needs: the Cloudflare and WorkOS cookie secrets stored in the workspace, and `ORUN_CI=true`.

Done when:

- a merge to `main` applies `cloudflare-kv` and deploys `demo` and `web` to stage, then prod
- `https://reacher-x-web-{stage,prod}.rahulvarghesepullely.workers.dev/home` and `https://reacher-x-demo-{stage,prod}.rahulvarghesepullely.workers.dev/agent` pass their smoke checks
- the `backend` job reports the Convex deploy skipped until its key is stored

## RX4 ready to hand over (RX-5)

Done when:

- the README says how to run, preview and deploy through Orun, and how to finish the cut-over: Convex deploy key and URL, WorkOS client and keys, `reacherx.com` DNS and the callback URLs
- `IMPLEMENTATION-STATUS.md` records every departure from upstream and from `design.md`

## Sequencing

RX1 is the risk: Next 16.4, Cache Components, the 10 MB limit. It lands
before any Orun wiring so its result is known first. RX2 adds the wiring
with Orun CI switched off, so it cannot block on credentials. RX3 is the
first public change and needs the secrets.
