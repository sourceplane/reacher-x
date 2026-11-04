// Full Shiki for client-side highlighting. Server builds alias this module to
// browserShiki.server.ts (next.config.mjs) so the grammars stay out of the
// Cloudflare Worker; CodeBlock only highlights in an effect, in the browser.
export { codeToHtml } from "shiki";
