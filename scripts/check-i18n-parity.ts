import ko from "../messages/ko.json";
import en from "../messages/en.json";

function flatten(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k)
  );
}

const koKeys = new Set(flatten(ko));
const enKeys = new Set(flatten(en));

const missingInEn = [...koKeys].filter((k) => !enKeys.has(k));
const missingInKo = [...enKeys].filter((k) => !koKeys.has(k));

if (missingInEn.length || missingInKo.length) {
  console.error("i18n key mismatch:");
  if (missingInEn.length) console.error("  missing in en.json:", missingInEn);
  if (missingInKo.length) console.error("  missing in ko.json:", missingInKo);
  process.exit(1);
}

console.log(`i18n parity OK — ${koKeys.size} keys in sync.`);
