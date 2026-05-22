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
import { FieldError } from "./FieldError";

const CUSTOM = "__custom__";

export function EmailField() {
  const t = useTranslations("contact.form");
  const { register, setValue, formState } = useFormContext();
  const [mode, setMode] = useState<string>(CUSTOM);
  const errors = formState.errors as Record<
    string,
    { message?: string } | undefined
  >;

  return (
    <div>
      <label className="block text-body-sm text-ink mb-1" htmlFor="emailLocal">
        {t("email")}
        <span aria-hidden className="text-error"> *</span>
      </label>
      {/* Reflows on the FORM width (container query), not the viewport: when
          the form is narrow (mobile) the domain preset drops to its own row;
          when it's wide enough (≥28rem) it's a single row. */}
      <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
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
        </div>
        <Select
          value={mode}
          onValueChange={(v) => {
            setMode(v);
            setValue("emailDomain", v === CUSTOM ? "" : v, {
              shouldValidate: true,
            });
          }}
        >
          <SelectTrigger
            className="w-full shrink-0 @md:w-36"
            aria-label={t("email")}
          >
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
      <FieldError name={["emailLocal", "emailDomain"]} />
    </div>
  );
}
