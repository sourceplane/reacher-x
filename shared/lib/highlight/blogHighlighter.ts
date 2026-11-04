import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Server-side highlighting for blog code blocks. Only the languages the blog
// uses are loaded: the full `shiki` bundle carries every grammar (about 9 MB)
// and its WebAssembly engine, too large for a Cloudflare Worker.
const highlighter = createHighlighterCore({
  themes: [
    import("shiki/themes/github-light.mjs"),
    import("shiki/themes/github-dark.mjs"),
  ],
  langs: [
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/tsx.mjs"),
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/jsx.mjs"),
    import("shiki/langs/json.mjs"),
    import("shiki/langs/shellscript.mjs"),
    import("shiki/langs/yaml.mjs"),
    import("shiki/langs/css.mjs"),
    import("shiki/langs/diff.mjs"),
    import("shiki/langs/python.mjs"),
    import("shiki/langs/sql.mjs"),
  ],
  engine: createJavaScriptRegexEngine(),
});

/** Highlight a code block, falling back to plain text for other languages. */
export async function highlightCode(code: string, requestedLanguage: string) {
  const shiki = await highlighter;
  const lang = shiki.getLoadedLanguages().includes(requestedLanguage)
    ? requestedLanguage
    : "text";
  return shiki.codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
  });
}
