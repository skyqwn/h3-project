"use client";

import {
  useEditor,
  EditorContent,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import { TextStyle, FontSize, Color } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { uploadImage } from "@/lib/blob-upload";

const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "40px",
];

// 파일들을 업로드해 에디터에 이미지 노드로 삽입한다(버튼·드롭·붙여넣기 공용).
// at(문서 위치)이 주어지면 그 위치에, 없으면 현재 커서 위치에 삽입.
// 이미지 뒤에 문단을 함께 넣어(여러 장일 때) 다음 삽입이 앞 이미지를 덮어쓰지
// 않게 한다. 치수는 실제 width/height 속성으로 저장(HTML).
async function insertUploadedImages(
  editor: Editor,
  files: FileList | File[],
  slug: string,
  at?: number
): Promise<void> {
  if (!slug) return;
  const imgs = Array.from(files).filter((f) => ALLOWED_IMG.includes(f.type));
  let pos = at;
  for (const file of imgs) {
    const { url, width, height } = await uploadImage(file, {
      slug,
      kind: "body",
    });
    const alt = file.name.replace(/\.[^.]+$/, "");
    const content = [
      { type: "image", attrs: { src: url, alt, width, height } },
      { type: "paragraph" },
    ];
    if (typeof pos === "number") {
      editor.chain().insertContentAt(pos, content).run();
      pos = editor.state.selection.to;
    } else {
      editor.chain().focus().insertContent(content).run();
    }
  }
}

// 위지윅 리치텍스트 에디터. 편집·저장 모두 HTML.
// value(초기 HTML) / onChange(HTML 문자열) 로 상위 폼과 연결한다.
export function RichTextEditor({
  value,
  slug,
  onChange,
}: {
  value: string;
  slug: string;
  onChange: (html: string) => void;
}) {
  // 드롭/붙여넣기 핸들러가 최신 editor·slug를 참조하도록 ref로 미러링.
  const editorRef = useRef<Editor | null>(null);
  const slugRef = useRef(slug);

  const editor = useEditor({
    extensions: [
      // StarterKit v3에 Link가 포함돼 있어 별도 확장을 넣지 않는다(중복 방지).
      StarterKit.configure({ link: { openOnClick: false } }),
      ImageExt.configure({ inline: false }),
      TextStyle,
      FontSize,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    // App Router(SSR)에서 하이드레이션 불일치를 막기 위해 즉시 렌더 끔.
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false; // 에디터 내부 노드 이동은 기본 동작
        const dt = (event as DragEvent).dataTransfer;
        const imgs = dt
          ? Array.from(dt.files).filter((f) => ALLOWED_IMG.includes(f.type))
          : [];
        if (imgs.length === 0) return false;
        event.preventDefault();
        const ed = editorRef.current;
        if (!ed) return true;
        const pos = ed.view.posAtCoords({
          left: (event as DragEvent).clientX,
          top: (event as DragEvent).clientY,
        })?.pos;
        void insertUploadedImages(ed, imgs, slugRef.current, pos);
        return true;
      },
      handlePaste: (_view, event) => {
        const cd = (event as ClipboardEvent).clipboardData;
        const imgs = cd
          ? Array.from(cd.files).filter((f) => ALLOWED_IMG.includes(f.type))
          : [];
        if (imgs.length === 0) return false; // 텍스트 등은 기본 붙여넣기
        event.preventDefault();
        const ed = editorRef.current;
        if (!ed) return true;
        void insertUploadedImages(ed, imgs, slugRef.current);
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);
  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-gray-300">
      <Toolbar editor={editor} slug={slug} />
      <EditorContent editor={editor} />
    </div>
  );
}

// 툴바 버튼 하나. onMouseDown preventDefault로 에디터 포커스를 뺏지 않아야
// 블록 변환(제목/목록/인용/정렬) 명령이 현재 블록에 정상 적용된다.
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
      label: "좌",
      isActive: editor.isActive({ textAlign: "left" }),
      run: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      label: "가운데",
      isActive: editor.isActive({ textAlign: "center" }),
      run: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      label: "우",
      isActive: editor.isActive({ textAlign: "right" }),
      run: () => editor.chain().focus().setTextAlign("right").run(),
    },
    {
      label: "링크",
      isActive: editor.isActive("link"),
      run: () => {
        const prev = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("링크 URL:", prev ?? "");
        if (url === null) return;
        if (url === "") {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }
        const { from, to } = editor.state.selection;
        if (from === to) {
          editor
            .chain()
            .focus()
            .insertContent(`<a href="${url}">${url}</a>`)
            .run();
        } else {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        }
      },
    },
  ];
}

// 글씨 크기 선택. 현재 선택 위치의 실제 크기를 콤보박스에 표시(커서 이동 시 갱신).
function FontSizeSelect({ editor }: { editor: Editor }) {
  const current = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "",
  });
  const value = current && FONT_SIZES.includes(current) ? current : "";
  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") editor.chain().focus().unsetFontSize().run();
        else editor.chain().focus().setFontSize(v).run();
      }}
      className="rounded border border-gray-300 px-1 py-1 text-sm"
      title="글씨 크기(px)"
    >
      <option value="">크기</option>
      {FONT_SIZES.map((px) => (
        <option key={px} value={px}>
          {px}
        </option>
      ))}
    </select>
  );
}

// 글자 색. 색상 선택 + 기본색 되돌리기.
function ColorControl({ editor }: { editor: Editor }) {
  return (
    <>
      <input
        type="color"
        defaultValue="#111827"
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        className="h-7 w-8 rounded border border-gray-300 align-middle"
        title="글자 색"
      />
      <ToolbarButton onRun={() => editor.chain().focus().unsetColor().run()}>
        색 기본
      </ToolbarButton>
    </>
  );
}

function Toolbar({ editor, slug }: { editor: Editor; slug: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
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
      <FontSizeSelect editor={editor} />
      <ColorControl editor={editor} />
      <ImageUploadButton editor={editor} slug={slug} />
    </div>
  );
}

// 파일 선택 → 여러 장 순서대로 업로드 → 글 끝에 이미지 삽입.
// slug가 없으면 비활성화(폴더가 slug 기준).
function ImageUploadButton({ editor, slug }: { editor: Editor; slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const disabled = busy || !slug;

  async function onFiles(files: FileList) {
    setBusy(true);
    try {
      editor.commands.focus("end");
      await insertUploadedImages(editor, files, slug);
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
