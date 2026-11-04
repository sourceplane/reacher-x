// Next's standalone trace for the nested demo app (demos/app, built with the
// repository as its Turbopack root) leaves out server chunks that
// instrumentation.js and some routes load at runtime. Copy the build's server
// directory over the standalone one, never overwriting, before OpenNext
// bundles it into the Worker.
import { cpSync } from "node:fs";

cpSync(
  "demos/app/.next/server",
  "demos/app/.next/standalone/demos/app/.next/server",
  { recursive: true, force: false }
);
console.log("[OpenNext] filled demos/app standalone server output");
