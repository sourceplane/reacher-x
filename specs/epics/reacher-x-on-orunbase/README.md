# Epic: reacher-x-on-orunbase (RX)

**ReacherX went dark when Vercel paused its account for reaching the plan's
usage limit (reacherx.com answered `402 DEPLOYMENT_DISABLED` on 2026-11-04).
This epic moves the two Next.js apps off Vercel onto Cloudflare Workers in an
account the product owns, deployed by Orunbase from this repository, while
Convex stays the backend exactly as it is. The one idea that makes it cheap:
nothing that runs on Convex moves, so the port is the Next.js hosting layer
only.**

ReacherX is a Next.js 16 app (`app/`, `features/`, `shared/`) plus an isolated
demo app (`demos/app`) and a large Convex backend (`convex/`). On Vercel the
two apps were two projects; Convex ran on Convex Cloud and was deployed by the
main project's build command. After this epic the apps are two Workers built
by `@opennextjs/cloudflare`, the Next.js cache lives in Workers KV and a
Durable Object, and a merge to `main` deploys stage and then prod through
Orun. The Convex deploy is wired and waits for its deploy key.

## Status

| Field            | Value                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status           | ✅ Shipped                                                                                                                                                                                                                                                                                                                                           |
| Cluster          | **RX** (RX0 to RX4)                                                                                                                                                                                                                                                                                                                                  |
| Owner(s)         | the repo root (`web`, the main app) · `demos/app` (`demo`) · `convex/` (`backend`) · `infra/` (the cache KV root and the repo-local compositions)                                                                                                                                                                                                    |
| Builds on        | upstream `VecterAI/reacher-x` at `fd33c49` (no baseline: ReacherX already has identity, billing and data in WorkOS, Polar and Convex)                                                                                                                                                                                                                |
| Changes          | adds the Orun intent, the Workers build and config, and the cache infrastructure; changes app code only where Workers force it (no filesystem at request time, Cache Components)                                                                                                                                                                     |
| Decisions locked | (1) A port, not a baseline. (2) Convex stays on Convex Cloud. (3) The code stays where it is; components are declared in `intent.yaml`. (4) The Next.js cache is KV plus a Durable Object queue, because the deploy token can write KV and not R2. (5) `experimental.useCache` replaces `cacheComponents` until opennextjs-cloudflare#1450 is fixed. |
| Gate             | RX1 is local (the apps build and serve on workerd). RX3 is the first public change: stage and prod on workers.dev.                                                                                                                                                                                                                                   |
| Shipped as       | stage and prod on workers.dev from `main` through Orun (#1, #3 to #12); Convex, WorkOS and reacherx.com waiting on the founder's accounts                                                                                                                                                                                                            |

## Read order

1. `design.md`: how each part of ReacherX maps onto Workers and Orun
2. `implementation-plan.md`: the milestones and what done means for each
3. `risks-and-open-questions.md`: what could go wrong and what was decided
4. `IMPLEMENTATION-STATUS.md`: what actually shipped

## Milestones at a glance

| Milestone                   | What it lands                                                                   | Done when                                                              |
| --------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| RX0 the spec                | this doc set and the task contracts                                             | merged                                                                 |
| RX1 the apps run on Workers | OpenNext builds for both apps, the Workers-forced code changes                  | `wrangler dev` serves the landing page, blog, pricing, OG images, demo |
| RX2 Orun runs it            | `intent.yaml`, the components, the cache KV root, the Convex deploy composition | a pull request plans and verifies every component                      |
| RX3 live on stage and prod  | the first convergence                                                           | the stage and prod workers.dev URLs pass their smoke checks            |
| RX4 ready to hand over      | the README's run, deploy and cut-over guide                                     | a maintainer can finish the cut-over from the README alone             |
