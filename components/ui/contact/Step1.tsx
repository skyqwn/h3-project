"use client";

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
import { EmailField } from "./EmailField";
import { FieldError } from "./FieldError";
import { PURPOSES, type Purpose } from "@/lib/contact-schema";

const PURPOSE_KEY: Record<Purpose, string> = {
  product: "purposeProduct",
  technical: "purposeTechnical",
  partnership: "purposePartnership",
  etc: "purposeEtc",
};

export function Step1() {
  const t = useTranslations("contact.form");
  const { register, setValue, watch, formState } = useFormContext();
  const purpose = watch("purpose");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="company">
          {t("company")}
          <span aria-hidden className="text-error"> *</span>
        </label>
        <Input
          id="company"
          aria-invalid={!!(formState.errors as Record<string, unknown>).company}
          {...register("company")}
        />
        <FieldError name="company" />
      </div>

      <div>
        <label
          className="block text-body-sm text-ink mb-1"
          htmlFor="contactName"
        >
          {t("contactName")}
          <span aria-hidden className="text-error"> *</span>
        </label>
        <Input
          id="contactName"
          aria-invalid={
            !!(formState.errors as Record<string, unknown>).contactName
          }
          {...register("contactName")}
        />
        <FieldError name="contactName" />
      </div>

      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="phone">
          {t("phone")}
          <span aria-hidden className="text-error"> *</span>
        </label>
        <Input
          id="phone"
          inputMode="tel"
          aria-invalid={!!(formState.errors as Record<string, unknown>).phone}
          {...register("phone")}
        />
        <FieldError name="phone" />
      </div>

      <EmailField />

      <div>
        <label className="block text-body-sm text-ink mb-1">
          {t("purpose")}
          <span aria-hidden className="text-error"> *</span>
        </label>
        <Select
          value={purpose}
          onValueChange={(v) =>
            setValue("purpose", v, { shouldValidate: true })
          }
        >
          <SelectTrigger aria-label={t("purpose")}>
            <SelectValue placeholder={t("purposePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {PURPOSES.map((p) => (
              <SelectItem key={p} value={p}>
                {t(PURPOSE_KEY[p])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError name="purpose" />
      </div>
    </div>
  );
}
