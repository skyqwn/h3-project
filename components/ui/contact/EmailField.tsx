"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_DOMAINS } from "@/lib/contact-schema";

const CUSTOM = "__custom__";
const VK = ["required", "invalidEmail", "invalidPhone"];

export function EmailField() {
  const t = useTranslations("contact.form");
  const { register, setValue, formState } = useFormContext();
  const [mode, setMode] = useState<string>(CUSTOM);
  const errors = formState.errors as Record<
    string,
    { message?: string } | undefined
  >;
  const err = errors.emailLocal?.message || errors.emailDomain?.message;

  return (
    <div>
      <label className="block text-body-sm text-ink mb-1" htmlFor="emailLocal">
        {t("email")}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id="emailLocal"
          className="min-w-0 flex-1"
          placeholder={t("emailLocalPlaceholder")}
          aria-invalid={!!errors.emailLocal}
          {...register("emailLocal")}
        />
        <span className="text-ink">@</span>
        <Input
          className="min-w-0 flex-1"
          placeholder={t("emailDomainPlaceholder")}
          disabled={mode !== CUSTOM}
          aria-invalid={!!errors.emailDomain}
          {...register("emailDomain")}
        />
        <Select
          value={mode}
          onValueChange={(v) => {
            setMode(v);
            setValue("emailDomain", v === CUSTOM ? "" : v, {
              shouldValidate: true,
            });
          }}
        >
          <SelectTrigger className="w-32 shrink-0" aria-label={t("email")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CUSTOM}>{t("emailDomainCustom")}</SelectItem>
            {EMAIL_DOMAINS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {err && (
        <p className="mt-1 text-body-sm text-error">
          {VK.includes(err) ? t(err) : err}
        </p>
      )}
    </div>
  );
}
