"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FileDropzone } from "./FileDropzone";
import { FieldError } from "./FieldError";

const MESSAGE_MAX = 2000;

export function Step2({
  fileError,
}: {
  fileError: string | null;
}) {
  const t = useTranslations("contact.form");
  const { register, watch, formState } = useFormContext();
  const msgLen = ((watch("message") as string) || "").length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="message">
          {t("message")}
        </label>
        <textarea
          id="message"
          rows={6}
          maxLength={MESSAGE_MAX}
          aria-invalid={
            !!(formState.errors as Record<string, unknown>).message
          }
          className="w-full px-3 py-3 rounded-md bg-canvas border border-ash text-body-md text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-error"
          {...register("message")}
        />
        <div className="mt-1 flex justify-end">
          <span
            className={cn(
              "text-caption-md tabular-nums",
              msgLen >= MESSAGE_MAX ? "text-error" : "text-mute"
            )}
          >
            {msgLen} / {MESSAGE_MAX}
          </span>
        </div>
        <FieldError name="message" />
      </div>

      <div>
        <label className="block text-body-sm text-ink mb-1">
          {t("file")}
        </label>
        <FileDropzone />
        {fileError && (
          <p className="mt-1 text-body-sm text-error">{t(fileError)}</p>
        )}
      </div>
    </div>
  );
}
