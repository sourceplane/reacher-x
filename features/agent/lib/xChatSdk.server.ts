// Server stand-in for xChatSdk.ts (see next.config.mjs). Never called: the
// SDK is only imported from browser-only code paths.
function browserOnly(): never {
  throw new Error("The X chat SDK runs in the browser only.");
}

export const createChat = browserOnly;
export const detectImageDimensions = browserOnly;
export const detectMimeType = browserOnly;
