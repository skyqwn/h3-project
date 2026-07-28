"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { useRef, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import ImageExt from "@tiptap/extension-image";
import { uploadImage } from "@/lib/blob-upload";
import { withDims } from "@/lib/image-src";

// 위지윅 리치텍스트 에디터. 편집은 보이는 대로, 저장은 마크다운.
// value(초기 마크다운) / onChange(마크다운 문자열) 로 상위 폼과 연결한다.
export function RichTextEditor({
  value,
  slug,
  onChange,
}: {
  value: string;
  slug: string;
  onChange: (markdown: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      // StarterKit v3에 Link가 포함돼 있어 별도 확장을 넣지 않는다(중복 방지).
      StarterKit.configure({ link: { openOnClick: false } }),
      Markdown,
      ImageExt.configure({ inline: false }),
    ],
    content: value,
    // App Router(SSR)에서 하이드레이션 불일치를 막기 위해 즉시 렌더 끔.
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // tiptap-markdown이 editor.storage.markdown을 추가하지만 타입 정의가
      // 없어 캐스팅해서 마크다운 문자열을 얻는다.
      const storage = editor.storage as unknown as {
        markdown?: { getMarkdown: () => string };
      };
      onChange(storage.markdown?.getMarkdown() ?? "");
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] px-4 py-3 focus:outline-none " +
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 " +
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 " +
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 " +
          "[&_p]:my-2 [&_p]:leading-7 " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 " +
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 " +
          "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-3 " +
          "[&_a]:text-blue-600 [&_a]:underline " +
          "[&_code]:bg-gray-100 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 " +
          "[&_img]:my-3 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-gray-300">
      <Toolbar editor={editor} slug={slug} />
      <EditorContent editor={editor} />
    </div>
  );
}

// 툴바 버튼 하나. onMouseDown preventDefault로 에디터 포커스를 뺏지 않아야
// 블록 변환(제목/목록/인용) 명령이 현재 블록에 정상 적용된다.
function ToolbarButton({
  onRun,
  isActive = false,
  className,
  children,
}: {
  onRun: () => void;
  isActive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onRun}
      className={[
        "px-2 py-1 text-sm rounded border hover:bg-gray-100",
        isActive ? "bg-gray-200 border-gray-300" : "border-transparent",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// 툴바 항목을 선언적으로 정의: 라벨 + 활성여부 + 실행 명령.
function toolbarItems(editor: Editor) {
  return [
    {
      label: "제목",
      isActive: editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "소제목",
      isActive: editor.isActive("heading", { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "굵게",
      className: "font-bold",
      isActive: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "기울임",
      className: "italic",
      isActive: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "• 목록",
      isActive: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "1. 목록",
      isActive: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "인용",
      isActive: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "링크",
      isActive: editor.isActive("link"),
      run: () => {
        const url = window.prompt("링크 URL:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
        else editor.chain().focus().unsetLink().run();
      },
    },
  ];
}

function Toolbar({ editor, slug }: { editor: Editor; slug: string }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
      {toolbarItems(editor).map((item) => (
        <ToolbarButton
          key={item.label}
          onRun={item.run}
          isActive={item.isActive}
          className={item.className}
        >
          {item.label}
        </ToolbarButton>
      ))}
      <ImageUploadButton editor={editor} slug={slug} />
    </div>
  );
}

// 파일 선택 → 여러 장 순서대로 업로드 → 커서 위치에 이미지 노드 삽입.
// slug가 없으면 비활성화(폴더가 slug 기준).
function ImageUploadButton({ editor, slug }: { editor: Editor; slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const disabled = busy || !slug;

  async function onFiles(files: FileList) {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const { url, width, height } = await uploadImage(file, {
          slug,
          kind: "body",
        });
        const alt = file.name.replace(/\.[^.]+$/, "");
        // 이미지 노드 + 빈 문단을 함께 삽입한다. setImage만 쓰면 삽입된
        // 이미지가 선택 상태로 남아, 다음 이미지가 앞 이미지를 덮어쓴다.
        // focus("end") + 뒤따르는 문단으로 커서를 이미지 뒤로 옮겨 여러 장을
        // 순서대로 쌓는다.
        editor
          .chain()
          .focus("end")
          .insertContent([
            { type: "image", attrs: { src: withDims(url, width, height), alt } },
            { type: "paragraph" },
          ])
          .run();
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="rounded border border-transparent px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-40"
        title={slug ? "이미지 업로드" : "slug를 먼저 입력하세요"}
      >
        {busy ? "업로드 중…" : "이미지"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0)
            onFiles(e.target.files);
        }}
      />
    </>
  );
}
