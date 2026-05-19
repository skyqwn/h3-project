"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { ALLOWED_FILE_EXT } from "@/lib/contact-schema";

export function Step2({
  fileError,
}: {
  fileError: string | null;
}) {
  const t = useTranslations("contact.form");
  const { register, formState } = useFormContext();
  const accept = ALLOWED_FILE_EXT.map((e) => `.${e}`).join(",");
  const msgErr = (formState.errors as Record<string, { message?: string }>)
    .message;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="message">
          {t("message")}
        </label>
        <textarea
          id="message"
          rows={6}
          aria-invalid={!!msgErr}
          className="w-full px-3 py-3 rounded-md bg-canvas border border-ash text-body-md text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-error"
          {...register("message")}
        />
        {msgErr?.message && (
          <p className="mt-1 text-body-sm text-error">{msgErr.message}</p>
        )}
      </div>

      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="file">
          {t("file")}
        </label>
        <input
          id="file"
          type="file"
          accept={accept}
          className="block w-full text-body-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-secondary-bg file:px-3 file:py-2 file:text-button-sm file:cursor-pointer"
          {...register("file")}
        />
        <p className="mt-1 text-body-sm text-mute">{t("fileHint")}</p>
        {fileError && (
          <p className="mt-1 text-body-sm text-error">{t(fileError)}</p>
        )}
      </div>
    </div>
  );
}
