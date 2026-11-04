# reacher-x-on-orunbase: risks and open questions

## RX-A: Cache Components on Workers (SETTLED)

`cacheComponents: true` makes requests fail or hang on Workers
(opennextjs-cloudflare#1450, open on 2026-11-04). Settled by
`experimental.useCache`: `"use cache"` keeps working, partial prerendering
does not. Revisit when the issue closes.

## RX-B: Worker size (SETTLED, close to the limit)

The first build was 13.5 MB compressed against a 10 MB limit (Workers
Paid; the Free plan allows 3 MB). Server stand-ins for Shiki and the X chat
SDK brought the main app to 9.4 MB and the demo to 8.9 MB. A new heavy
dependency imported from a client component can push it over again; the
`verify-build-output` step and `wrangler deploy --dry-run` report the size
on every pull request. If it grows, the next levers are minification (see
RX-C) and moving more browser-only code behind stand-ins.

## RX-C: esbuild minifier panic (ACCEPTED)

esbuild 0.27 and 0.28 panic with syntax minification on one Turbopack
server chunk ("Unexpected expression of type <nil>"). The Worker is
bundled with `--noMinify`, which costs roughly a few hundred KB
compressed. Reproduce with `esbuild <chunk> --minify-syntax`; worth an
upstream report.

## RX-D: Workers Paid plan (RISK)

Both Workers are over the Free plan's 3 MB limit. The Cloudflare account
behind the workspace's connection must be on Workers Paid ($5 a month).

## RX-E: WorkOS AuthKit in Node middleware (SETTLED)

`proxy.ts` runs as Node middleware on OpenNext 1.20 (experimental there).
Verified on workerd: anonymous pages render, `/login` and `/signup`
redirect to WorkOS with a sealed PKCE state. A real sign-in needs the
founder's WorkOS client.

## RX-F: No Convex deployment yet (ACCEPTED)

Without `NEXT_PUBLIC_CONVEX_URL` pointing at a real deployment, public
pages render with their documented fallbacks (no live plan offers, no
testimonials) and the app behind sign-in cannot load data. The `backend`
component deploys as soon as `CONVEX_DEPLOY_KEY` is stored.

## RX-G: Build memory (ACCEPTED)

`next build` with Next 16.4 needs more than Node's 2 GB default heap on
small machines. Components set `NODE_OPTIONS=--max-old-space-size=6144`;
GitHub runners have 16 GB.

## RX-H: Preview deployments (OPEN)

Vercel built a preview per pull request. Here stage is shared. Workers
versions with preview URLs plus Convex preview deployments could bring
previews back; not in this epic.
