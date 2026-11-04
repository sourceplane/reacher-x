import { BlogAuthor } from "@/features/blog/ui/components/BlogAuthor";
import type { Metadata } from "next";
import { blogExampleSource } from "@/shared/lib/generated/serverContent";
import Content from "@/content/blog-examples/content.mdx";
import { BlogArticle } from "@/features/blog/ui/components/BlogArticle";
import { parseBlogPost } from "@/features/blog/lib/blogContentCore";
import { getBlogPosts } from "@/features/blog/lib/blogPosts";

export const metadata: Metadata = {
  title: "Content preview | ReacherX",
  description: "A preview of ReacherX blog content blocks.",
  robots: { index: false, follow: false },
};
export default async function BlogContentPreview() {
  const related = await getBlogPosts();
  const post = parseBlogPost(blogExampleSource, "content-preview");
  return (
    <BlogArticle
      author={<BlogAuthor />}
      post={post}
      related={related.slice(0, 2)}
      preview
    >
      <Content />
    </BlogArticle>
  );
}
