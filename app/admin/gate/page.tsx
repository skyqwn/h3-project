"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitGate } from "@/actions/admin/auth";

export default function GatePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitGate(password);
      if (result.ok) router.push("/admin/login");
      else setError(result.error ?? "오류");
    });
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-xl font-bold">접근 확인</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="접근 비밀번호"
          autoFocus
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "확인 중…" : "다음"}
        </button>
      </form>
    </div>
  );
}
