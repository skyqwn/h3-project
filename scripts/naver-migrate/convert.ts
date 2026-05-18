import { parse, type HTMLElement } from "node-html-parser";
import type { ConvertResult } from "./types";

// SmartEditor component classes we convert losslessly. se-horizontalLine is
// listed so it is recognized (no "unsupported" warning) even though we emit
// nothing for it — Naver authors use it as decorative spacing, and a literal
// `---` between every block is visual noise on our design.
const SUPPORTED = new Set([
  "se-text",
  "se-quotation",
  "se-list",
  "se-image",
  "se-imageStrip",
  "se-table",
  "se-horizontalLine",
]);

// Zero-width / joiner / BOM chars that Naver's editor sprinkles into
// text runs, plus NBSP. Patterns are built from char codes so the
// source file stays pure ASCII (ESLint no-irregular-whitespace).
const ZERO_WIDTH = new RegExp(String.fromCharCode(0x5b, 0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x5d), "g");
const NBSP = new RegExp(String.fromCharCode(0xa0), "g");

function clean(s: string): string {
  return s.replace(ZERO_WIDTH, "").replace(NBSP, " ").trim();
}

function pushImg(
  img: HTMLElement,
  imageUrls: string[],
  out: string[]
): void {
  const src =
    img.getAttribute("data-lazy-src") ||
    img.getAttribute("src") ||
    img.getAttribute("data-src") ||
    "";
  if (!src) return;
  const idx = imageUrls.length;
  imageUrls.push(src);
  const alt = clean(img.getAttribute("alt") || "").replace(/[\]\n]/g, " ");
  out.push(`![${alt}](__IMAGE_${idx}__)`);
}

function textOf(el: HTMLElement): string {
  // Each se-text-paragraph is a line; collapse whitespace, keep line breaks.
  const paras = el.querySelectorAll("p");
  const lines =
    paras.length > 0
      ? paras.map((p) => clean(p.text.replace(/\s+/g, " ")))
      : [clean(el.text.replace(/\s+/g, " "))];
  return lines.filter(Boolean).join("\n");
}

function tableOf(comp: HTMLElement): string {
  const rows = comp.querySelectorAll("tr");
  const matrix = rows
    .map((tr) =>
      tr
        .querySelectorAll("td, th")
        .map((c) =>
          clean(c.text.replace(/\s+/g, " ")).replace(/\|/g, "\\|")
        )
    )
    .filter((r) => r.length > 0);
  if (matrix.length === 0) return "";

  const cols = Math.max(...matrix.map((r) => r.length));
  const pad = (r: string[]): string[] => {
    const copy = [...r];
    while (copy.length < cols) copy.push("");
    return copy;
  };
  const toRow = (r: string[]): string => `| ${pad(r).join(" | ")} |`;

  const header = toRow(matrix[0]!);
  const delim = `| ${Array(cols).fill("---").join(" | ")} |`;
  const body = matrix.slice(1).map(toRow);
  return [header, delim, ...body].join("\n");
}

export function convertSmartEditor(html: string): ConvertResult {
  const root = parse(html);
  const container = root.querySelector(".se-main-container") ?? root;
  const components = container.querySelectorAll(".se-component");

  const out: string[] = [];
  const imageUrls: string[] = [];
  const warnings: string[] = [];

  for (const comp of components) {
    const classes = comp.classNames.split(/\s+/);

    // se-imageStrip is a multi-image gallery row — emit every img.
    if (classes.includes("se-imageStrip")) {
      for (const img of comp.querySelectorAll("img")) {
        pushImg(img, imageUrls, out);
      }
      continue;
    }

    if (classes.includes("se-image")) {
      const img = comp.querySelector("img");
      if (img) pushImg(img, imageUrls, out);
      continue;
    }

    // Decorative divider — drop it (no `---` noise, no warning).
    if (classes.includes("se-horizontalLine")) {
      continue;
    }

    if (classes.includes("se-table")) {
      const md = tableOf(comp);
      if (md) out.push(md);
      continue;
    }

    if (classes.includes("se-quotation")) {
      const t = textOf(comp);
      if (!t) continue;
      // Naver's "quotation_line" layout is used as a SECTION HEADING, not a
      // quote. Every other quotation layout is a real callout/quote.
      if (classes.includes("se-l-quotation_line")) {
        out.push(`## ${t.replace(/\n+/g, " ").trim()}`);
      } else {
        out.push(
          t
            .split("\n")
            .map((l) => `> ${l}`)
            .join("\n")
        );
      }
      continue;
    }

    if (classes.includes("se-list")) {
      const items = comp.querySelectorAll("li");
      for (const li of items) {
        const t = clean(li.text.replace(/\s+/g, " "));
        if (t) out.push(`- ${t}`);
      }
      continue;
    }

    if (classes.includes("se-text")) {
      const t = textOf(comp);
      if (t) out.push(t);
      continue;
    }

    // anything else: unsupported widget
    const unknown =
      classes.find(
        (c) => c.startsWith("se-") && c !== "se-component" && !SUPPORTED.has(c)
      ) ?? "se-unknown";
    warnings.push(
      `unsupported block "${unknown}" skipped — fix manually in the draft`
    );
  }

  return {
    mdxBody: out.join("\n\n").trim() + "\n",
    imageUrls,
    warnings,
  };
}
