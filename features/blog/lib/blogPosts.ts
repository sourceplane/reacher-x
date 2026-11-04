import { cache } from "react";
import { blogPostSources } from "@/shared/lib/generated/serverContent";
import { getCurrentUTCTimestamp } from "@/shared/lib/utils/time/timeUtils";
import { parseBlogPost, publicBlogPosts } from "./blogContentCore";
import type { BlogPostSummary } from "./blogHelpers";

// Sources come from content/blog, bundled at build time by
// scripts/generate-server-content.mjs (Workers cannot read files at runtime).
export const getBlogPosts = cache(async () => {
  const posts = blogPostSources.map(({ slug, source }) =>
    parseBlogPost(source, slug)
  );
  return publicBlogPosts(
    posts,
    new Date(getCurrentUTCTimestamp()).toISOString().slice(0, 10)
  );
});

export async function getBlogPost(slug: string) {
  // Lookup before importing or reading a requested file prevents traversal and
  // keeps drafts/future posts out of every public endpoint.
  return (await getBlogPosts()).find((post) => post.slug === slug);
}

export function summarizeBlogPost(
  post: Awaited<ReturnType<typeof getBlogPosts>>[number]
): BlogPostSummary {
  const { content: _content, headings: _headings, ...summary } = post;
  return summary;
}
