"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Paperclip, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALLOWED_FILE_EXT } from "@/lib/contact-schema";

// Single-file dropzone. Keeps a real <input id="file"> in the DOM so the
// ContactForm submit (which reads document.getElementById("file")) works
// unchanged. Drag-drop assigns the file to that input via DataTransfer.
// The outer box keeps a fixed size in every state (empty / filled /
// dragging) so selecting a file never shifts the layout.
export function FileDropzone() {
  const t = useTranslations("contact.form");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const accept = ALLOWED_FILE_EXT.map((e) => `.${e}`).join(",");

  const setFile = (file: File | null) => {
    const input = inputRef.current;
    if (!input) return;
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      setName(file.name);
    } else {
      input.value = "";
      setName(null);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0] ?? null;
        if (f) setFile(f);
      }}
      className={cn(
        "flex min-h-[140px] w-full items-center justify-center rounded-md border border-dashed px-4 py-6 transition-colors",
        drag ? "border-primary bg-surface-card" : "border-ash bg-canvas"
      )}
    >
      <input
        ref={inputRef}
        id="file"
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => setName(e.target.files?.[0]?.name ?? null)}
      />
      {name ? (
        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex max-w-full items-center gap-2 rounded-md bg-surface-card px-3 py-2">
            <Paperclip
              aria-hidden
              className="size-4 shrink-0 text-mute"
            />
            <span className="min-w-0 truncate text-body-sm text-ink">
              {name}
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label={t("fileRemove")}
              className="shrink-0 rounded-sm p-0.5 text-mute hover:text-ink cursor-pointer"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
          <span className="text-caption-md text-mute">
            {t("fileReplace")}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 text-center cursor-pointer"
        >
          <Upload aria-hidden className="size-6 text-mute" />
          <span className="text-body-sm text-ink">{t("fileDrop")}</span>
          <span className="text-body-sm text-mute">{t("fileHint")}</span>
        </button>
      )}
    </div>
  );
}
