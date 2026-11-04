// Server stand-in for browserShiki.ts (see next.config.mjs). Never called:
// client components highlight in effects, which do not run on the server.
export function codeToHtml(): Promise<string> {
  throw new Error("Client-side highlighting runs in the browser only.");
}
