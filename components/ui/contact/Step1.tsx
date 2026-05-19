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
import { PURPOSES, type Purpose } from "@/lib/contact-schema";

const VK = ["required", "invalidEmail", "invalidPhone"];
function Err({ name }: { name: string }) {
  const t = useTranslations("contact.form");
  const { formState } = useFormContext();
  const e = (formState.errors as Record<string, { message?: string }>)[name];
  if (!e?.message) return null;
  const m = e.message;
  return (
    <p className="mt-1 text-body-sm text-error">
      {VK.includes(m) ? t(m) : m}
    </p>
  );
}

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
        </label>
        <Input
          id="company"
          aria-invalid={!!(formState.errors as Record<string, unknown>).company}
          {...register("company")}
        />
        <Err name="company" />
      </div>

      <div>
        <label
          className="block text-body-sm text-ink mb-1"
          htmlFor="contactName"
        >
          {t("contactName")}
        </label>
        <Input
          id="contactName"
          aria-invalid={
            !!(formState.errors as Record<string, unknown>).contactName
          }
          {...register("contactName")}
        />
        <Err name="contactName" />
      </div>

      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="phone">
          {t("phone")}
        </label>
        <Input
          id="phone"
          inputMode="tel"
          aria-invalid={!!(formState.errors as Record<string, unknown>).phone}
          {...register("phone")}
        />
        <Err name="phone" />
      </div>

      <EmailField />

      <div>
        <label className="block text-body-sm text-ink mb-1">
          {t("purpose")}
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
        <Err name="purpose" />
      </div>
    </div>
  );
}
