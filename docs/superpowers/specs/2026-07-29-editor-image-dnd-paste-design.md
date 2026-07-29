# 에디터 이미지 드래그앤드롭·붙여넣기 + 표시 크기 개선 — 설계

- 날짜: 2026-07-29
- 상태: 승인됨(구현 계획 작성 예정)
- 선행: 본문 이미지 업로드(버튼 방식)·`uploadImage`·`withDims`·mdx 렌더 구현됨.

## 목표

관리자 에디터에서 이미지를 **드래그앤드롭·붙여넣기(Ctrl+V)** 로 넣을 수 있게 하고,
공개 블로그의 본문 이미지가 **작은 이미지는 원본 크기 유지(억지로 안 늘림)** 되도록
표시 방식을 고친다.

## 범위

1. **드래그앤드롭**: 이미지 파일을 에디터에 떨구면 떨어뜨린 위치에 업로드·삽입.
2. **붙여넣기**: 클립보드 이미지(스크린샷 등)를 커서 위치에 업로드·삽입.
3. **표시 크기(B)**: 본문 이미지 렌더를 "칼럼 폭까지, 그 이하 원본 크기, 가운데
   정렬"로 변경(작은 이미지 업스케일 방지).

## 비목표(후순위)

- 이미지 크기 조절 UI(작게/보통/크게, 드래그 핸들) — 별도 기능.
- 업로드 중 자리표시(placeholder) 스피너 — 스크린샷은 보통 1~2초라 v1 제외.

## 설계

### 1) 공용 삽입 헬퍼 (DRY 리팩터링)

지금 `ImageUploadButton.onFiles` 안에 인라인으로 있는 "파일→측정→업로드→삽입"
로직을 컴포넌트 밖 공용 함수로 추출:

```
insertUploadedImages(editor, files: File[] | FileList, slug: string, opts?: { at?: number }): Promise<void>
```
- 이미지 형식만 필터(JPG·PNG·WebP·AVIF), slug 없으면 no-op.
- 각 파일: `uploadImage(file,{slug,kind:"body"})` → `withDims(url,w,h)` → 이미지
  노드 + 문단 삽입. `opts.at`(드롭 위치)이 있으면 그 위치, 없으면 현재 커서/끝.
- 버튼·드롭·붙여넣기 셋이 이 함수를 공유.

### 2) Tiptap 핸들러 (RichTextEditor `editorProps`)

- `handleDrop(view, event, _slice, moved)`: `moved`(에디터 내부 드래그)면 false.
  `event.dataTransfer`에 **이미지 파일**이 있으면 `preventDefault`, 드롭 좌표를
  `view.posAtCoords({left, top})`로 구해 `insertUploadedImages(..., {at})` 호출,
  `return true`. 이미지 없으면 `return false`(기본 동작).
- `handlePaste(view, event)`: `event.clipboardData`에 **이미지 파일**이 있으면
  `preventDefault`, `insertUploadedImages(...)`(커서 위치), `return true`. 없으면
  `return false`(일반 텍스트 붙여넣기 등 기본 동작 유지).
- slug는 `RichTextEditor` prop으로 이미 받음. 핸들러는 클로저로 최신 slug 참조.

### 3) 표시 크기(B) — `mdx-components.tsx` img

- 현재 클래스 `block w-full h-auto …`에서 **`w-full` 제거** → `mx-auto block
  h-auto max-w-full …`. next/image는 측정된 width/height를 그대로 가지므로,
  `max-w-full`이 칼럼 폭까지만 제한하고 작은 이미지는 원본 크기로 가운데 정렬.
- `sizes`는 유지(칼럼 최대 ~768px 기준). 에디터 내부 미리보기는 이미
  `[&_img]:max-w-full`이라 변경 불필요.

## 파일

- `components/admin/RichTextEditor.tsx` — `insertUploadedImages` 추출, `editorProps`에
  `handleDrop`/`handlePaste` 추가, `ImageUploadButton`을 헬퍼 사용으로 정리.
- `mdx-components.tsx` — img 클래스에서 `w-full`→`max-w-full mx-auto`.

## 엣지/주의

- 이미지가 아닌 드롭/붙여넣기(텍스트·PDF 등)는 가로채지 않음(`return false`).
- 에디터 내부 노드 드래그 이동은 기존 동작 유지(`moved===true`면 무시).
- 여러 장 동시 드롭/붙여넣기: 순서대로 업로드·삽입.
- `tiptap-markdown` 직렬화·왕복은 기존 이미지 노드와 동일(변화 없음).

## 검증

- `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm build` exit 0.
- browse: (a) 합성 `paste`/`drop` 이벤트에 이미지 `File`을 실어 에디터에서
  업로드·삽입되는지, (b) 작은 이미지(예: 192×192 아이콘) 발행 후 공개 페이지에서
  **원본 크기(안 늘어남)·가운데**로 뜨는지, 큰 이미지는 칼럼 폭까지 차는지 확인.
  (합성 이벤트가 불안정하면 업로드 경로는 버튼으로 이미 검증됨 — 렌더/헬퍼 중심 확인.)
- 테스트로 만든 글·Blob은 삭제로 정리.
