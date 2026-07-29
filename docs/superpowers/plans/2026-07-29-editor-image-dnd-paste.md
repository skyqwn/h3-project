# 에디터 이미지 드래그앤드롭·붙여넣기 + 표시 크기 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 에디터에 이미지를 드래그앤드롭·붙여넣기로 넣고, 공개 블로그 본문 이미지가 작은 것은 원본 크기(안 늘림)로 보이게 한다.

**Architecture:** 기존 "파일→업로드→삽입" 로직을 공용 헬퍼 `insertUploadedImages`로 추출해 버튼·드롭·붙여넣기가 공유(DRY). Tiptap `editorProps.handleDrop`/`handlePaste`에서 이미지 파일만 가로채 헬퍼 호출. 렌더는 `mdx-components` img 클래스에서 `w-full` 제거.

**Tech Stack:** Tiptap v3(@tiptap/react, ProseMirror view), `@vercel/blob` client(`uploadImage`), next/image.

## Global Constraints

- 패키지 매니저 **pnpm** 고정.
- 이미지 형식은 `image/jpeg`, `image/png`, `image/webp`, `image/avif`만.
- 이미지 아닌 드롭/붙여넣기·에디터 내부 노드 드래그(`moved===true`)는 가로채지 않고 `return false`.
- 모든 이미지 next/image(본문·커버). slug 없으면 업로드 no-op(자동 채워지니 사실상 항상 있음).
- 매 태스크 종료 시 `pnpm exec tsc --noEmit` + `pnpm run lint` 통과.
- **커밋/푸시는 사용자가 명시적으로 지시할 때만.** 각 태스크 commit 단계는 승인 시 실행, 그 전엔 tsc/lint로만 검증. 커밋 전 `pnpm build` exit 0.
- `.claude/settings.json`은 스테이징하지 않는다.

---

### Task 1: 공용 삽입 헬퍼 추출 (리팩터링, 동작 불변)

`ImageUploadButton.onFiles` 안의 업로드·삽입 로직을 모듈 레벨 `insertUploadedImages`로 빼고, 버튼이 그걸 쓰게 한다. 동작은 그대로.

**Files:**
- Modify: `components/admin/RichTextEditor.tsx`

**Interfaces:**
- Consumes: `uploadImage` (`@/lib/blob-upload`), `withDims` (`@/lib/image-src`), `Editor` (`@tiptap/react`).
- Produces:
  - `const ALLOWED_IMG = ["image/jpeg","image/png","image/webp","image/avif"]`
  - `async function insertUploadedImages(editor: Editor, files: FileList | File[], slug: string, at?: number): Promise<void>` — 이미지 파일만 골라 순서대로 업로드 후, `at`(문서 위치)이 있으면 그 위치에, 없으면 현재 커서에 `이미지+문단` 삽입.

- [ ] **Step 1: 헬퍼 추가**

`components/admin/RichTextEditor.tsx`의 `import` 아래(컴포넌트 정의 위)에 추가:
```tsx
const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// 파일들을 업로드해 에디터에 이미지 노드로 삽입한다(버튼·드롭·붙여넣기 공용).
// at(문서 위치)이 주어지면 그 위치에, 없으면 현재 커서 위치에 삽입.
// 이미지 노드 뒤에 문단을 함께 넣어(여러 장일 때) 다음 삽입이 앞 이미지를
// 덮어쓰지 않게 한다.
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
      { type: "image", attrs: { src: withDims(url, width, height), alt } },
      { type: "paragraph" },
    ];
    if (typeof pos === "number") {
      editor.chain().insertContentAt(pos, content).run();
      pos = editor.state.selection.to; // 다음 이미지는 방금 삽입 뒤로
    } else {
      editor.chain().focus().insertContent(content).run();
    }
  }
}
```

- [ ] **Step 2: 버튼이 헬퍼를 쓰도록 교체**

`ImageUploadButton`의 `onFiles`를 아래로 교체(직접 삽입 로직 제거):
```tsx
  async function onFiles(files: FileList) {
    setBusy(true);
    try {
      // 버튼 업로드는 글 끝에 이어붙인다.
      editor.commands.focus("end");
      await insertUploadedImages(editor, files, slug);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
```

- [ ] **Step 3: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 4: 버튼 동작 스모크(수동/browse)**

dev 서버(8000)에서 `/admin/posts/new` → "이미지" 버튼으로 이미지 삽입이 여전히
되는지 확인(회귀 없음). (자세한 E2E는 Task 4.)

- [ ] **Step 5: 커밋(사용자 승인 시)**

```bash
git add components/admin/RichTextEditor.tsx
git commit -m "블로그(에디터): 이미지 삽입 로직을 공용 헬퍼로 추출(리팩터)"
```

---

### Task 2: 드래그앤드롭 + 붙여넣기 핸들러

`editorProps`에 `handleDrop`/`handlePaste`를 추가한다. 핸들러가 최신 editor/slug를 참조하도록 ref를 쓴다.

**Files:**
- Modify: `components/admin/RichTextEditor.tsx`

**Interfaces:**
- Consumes: `insertUploadedImages`, `ALLOWED_IMG` (Task 1), `useRef`.

- [ ] **Step 1: editor/slug ref 추가**

`RichTextEditor` 컴포넌트 본문 맨 위(`const editor = useEditor(...)` 위)에 추가:
```tsx
  const editorRef = useRef<Editor | null>(null);
  const slugRef = useRef(slug);
  slugRef.current = slug;
```

- [ ] **Step 2: editorProps에 핸들러 추가**

`editorProps`의 `attributes: { ... }` 뒤에 `handleDrop`/`handlePaste`를 추가(같은
`editorProps` 객체 안):
```tsx
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
```

- [ ] **Step 3: editorRef 채우기**

`const editor = useEditor({...})` 바로 다음 줄에 추가:
```tsx
  editorRef.current = editor;
```
(그 아래 기존 `if (!editor) return null;`는 그대로 둔다.)

- [ ] **Step 4: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 5: 커밋(사용자 승인 시)**

```bash
git add components/admin/RichTextEditor.tsx
git commit -m "블로그(에디터): 이미지 드래그앤드롭·붙여넣기 업로드"
```

---

### Task 3: 본문 이미지 표시 크기(B) — 작은 이미지 원본 유지

**Files:**
- Modify: `mdx-components.tsx`

**Interfaces:**
- 없음(클래스 문자열만 변경).

- [ ] **Step 1: img 클래스에서 w-full 제거**

`mdx-components.tsx`의 `img` 매핑 안 `cls` 정의를 아래로 교체:
```tsx
    const cls =
      "mx-auto block h-auto max-w-full my-8 rounded-md border border-hairline-soft bg-surface-card";
```
(기존은 `"block w-full h-auto my-8 …"`. `w-full`을 없애 작은 이미지는 원본 크기,
큰 이미지는 `max-w-full`로 칼럼 폭까지, `mx-auto`로 가운데 정렬. next/image·raw
img 폴백 둘 다 이 `cls`를 쓰므로 한 번에 반영.)

- [ ] **Step 2: 유닛/타입/린트**

Run:
```bash
pnpm run test:unit && pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 전부 통과(rehype-image-dimensions·image-src 테스트 영향 없음).

- [ ] **Step 3: 커밋(사용자 승인 시)**

```bash
git add mdx-components.tsx
git commit -m "블로그(이미지): 본문 작은 이미지 업스케일 방지(원본 크기·가운데)"
```

---

### Task 4: E2E 스모크 + 빌드

**Files:** (없음 — 검증)

- [ ] **Step 1: 개발 서버(8000) 기동**

8000에서 안 떠 있으면 백그라운드 기동, 끝나면 트리 종료 + 포트 확인.

- [ ] **Step 2: browse — 붙여넣기/드롭 합성 이벤트**

`/admin/posts/new`에서 제목 입력(slug 자동) 후, browse `js`로 이미지 `File`을
만들어 `.ProseMirror`에 `paste`(그리고 `drop`) 이벤트를 합성 디스패치 →
에디터에 `img`가 늘어나는지(`document.querySelectorAll('.ProseMirror img').length`)
확인. 예시(파일은 public 이미지를 fetch해 File로):
```js
const blob = await fetch('/feature-site.jpg').then(r=>r.blob());
const file = new File([blob],'feature-site.jpg',{type:'image/jpeg'});
const dt = new DataTransfer(); dt.items.add(file);
const el = document.querySelector('.ProseMirror'); el.focus();
el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));
```
합성 이벤트가 ProseMirror에서 안 먹으면(환경차), 업로드 경로는 버튼으로 이미
검증됐으므로 **핸들러 존재/타입만 확인하고 실제 붙여넣기는 수동 확인**으로 대체.

- [ ] **Step 3: browse — 표시 크기(B) 확인**

작은 이미지(예: `/android-chrome-192x192.png`, 192×192)를 넣은 글을 발행 → 공개
상세에서 그 이미지의 렌더 폭이 **원본 192px 근처(칼럼 폭으로 안 늘어남)** 이고
가운데 정렬인지 확인:
```js
JSON.stringify([...document.querySelectorAll('article img, main img')]
  .map(i=>({w:i.getBoundingClientRect().width, natural:i.naturalWidth})))
```
큰 이미지는 칼럼 폭(~768px 이하)까지 차는지도 확인.

- [ ] **Step 4: 정리 + 빌드**

테스트로 만든 글은 삭제 기능으로 제거(연결 Blob도 정리됨). node 종료 후:
```bash
pnpm build
```
Expected: exit 0. 서버 트리 종료 후 포트 확인.

---

## Self-Review 결과

- **스펙 커버리지:** 공용 헬퍼=Task1, 드롭/붙여넣기=Task2, 표시 크기(B)=Task3,
  검증=Task4. 비목표(크기조절 UI·placeholder)는 계획에 없음(의도적).
- **플레이스홀더:** 없음(모든 코드 완결).
- **타입 일관성:** `insertUploadedImages(editor, files, slug, at?)`, `ALLOWED_IMG`,
  `editorRef`/`slugRef`, `cls` 문자열 일관. `handleDrop`/`handlePaste`는 Tiptap
  `editorProps` 시그니처(`return false`=기본 동작).
- **주의:** 핸들러는 `editorRef.current`(최신 editor)·`slugRef.current`(최신 slug)를
  읽어 useEditor 클로저 stale 문제 회피.
