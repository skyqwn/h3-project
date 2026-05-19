import assert from "node:assert/strict";
import {
  ContactInputSchema,
  PURPOSES,
  MAX_FILE_BYTES,
  ALLOWED_FILE_EXT,
} from "../../lib/contact-schema";

(async () => {
  const base = {
    company: "H3",
    contactName: "홍길동",
    phone: "010-1234-5678",
    email: "a@b.com",
    purpose: "product",
    message: "안녕하세요",
    locale: "ko",
    turnstileToken: "tok",
    honeypot: "",
  };

  assert.equal(ContactInputSchema.safeParse(base).success, true, "valid input passes");

  assert.equal(
    ContactInputSchema.safeParse({ ...base, company: "" }).success,
    false,
    "company is required"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, contactName: "" }).success,
    false,
    "contactName is required"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, phone: "abc" }).success,
    false,
    "phone rejects letters"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, phone: "+82 10 1234 5678" }).success,
    true,
    "phone allows + space digits"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, purpose: "nope" }).success,
    false,
    "purpose enum enforced"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, email: "notanemail" }).success,
    false,
    "email must be valid"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, honeypot: "x" }).success,
    false,
    "honeypot must stay empty"
  );

  assert.deepEqual(
    PURPOSES,
    ["product", "technical", "partnership", "etc"],
    "purpose options stable"
  );
  assert.equal(MAX_FILE_BYTES, 5 * 1024 * 1024, "5MB cap");
  assert.ok(
    ALLOWED_FILE_EXT.includes("pdf") && ALLOWED_FILE_EXT.includes("docx"),
    "allowed ext list"
  );

  const { ContactClientSchema, composeEmail } = await import(
    "../../lib/contact-schema"
  );
  assert.equal(composeEmail("user", "gmail.com"), "user@gmail.com", "compose");
  const cbase = {
    company: "H3",
    contactName: "홍길동",
    phone: "010-1234-5678",
    emailLocal: "user",
    emailDomain: "gmail.com",
    purpose: "product",
    message: "hi",
    locale: "ko",
    turnstileToken: "t",
    honeypot: "",
  };
  assert.equal(ContactClientSchema.safeParse(cbase).success, true, "client ok");
  assert.equal(
    ContactClientSchema.safeParse({ ...cbase, emailLocal: "a b" }).success,
    false,
    "local part rejects space"
  );
  assert.equal(
    ContactClientSchema.safeParse({ ...cbase, emailDomain: "nodot" }).success,
    false,
    "domain must look like a hostname"
  );
  console.log("contact-schema.test: 15 assertions passed.");
})().catch((err) => {
  console.error("contact-schema.test FAILED:", err);
  process.exit(1);
});
