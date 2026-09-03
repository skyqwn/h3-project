"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/actions/admin/posts";

export function DeletePostButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      const result = await deletePost(slug);
      if (result.ok) router.refresh();
      else window.alert(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "삭제 중…" : "삭제"}
    </button>
  );
}
