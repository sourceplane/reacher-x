// The X chat SDK, loaded lazily by xChatBrowserSession in the browser. Server
// builds alias this module to xChatSdk.server.ts (next.config.mjs) so the
// SDK's WebAssembly (about 4 MB) stays out of the Cloudflare Worker.
export * from "@xdevplatform/chat-xdk";
