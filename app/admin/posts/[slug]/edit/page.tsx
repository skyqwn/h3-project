import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { queryPostBySlug, rowToPost } from "@/lib/db/posts-repo";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await queryPostBySlug(slug);
  if (!row) notFound();
  const post = rowToPost(row, "ko");

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">글 편집</h1>
      <PostForm
        mode="edit"
        initialPost={{
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          category: post.category,
          tags: post.tags,
          coverImage: post.coverImage,
          body: post.body,
          draft: post.draft,
        }}
      />
    </div>
  );
}
