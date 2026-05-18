import { parse, type HTMLElement } from "node-html-parser";
import type { ConvertResult } from "./types";

// SmartEditor component classes we convert losslessly.
const SUPPORTED = new Set(["se-text", "se-quotation", "se-list", "se-image"]);

function textOf(el: HTMLElement): string {
  // Each se-text-paragraph is a line; collapse whitespace, keep line breaks.
  const paras = el.querySelectorAll("p");
  const lines =
    paras.length > 0
      ? paras.map((p) => p.text.replace(/\s+/g, " ").trim())
      : [el.text.replace(/\s+/g, " ").trim()];
  return lines.filter(Boolean).join("\n");
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

    if (classes.includes("se-image")) {
      const img = comp.querySelector("img");
      if (img) {
        const src =
          img.getAttribute("data-lazy-src") ||
          img.getAttribute("src") ||
          img.getAttribute("data-src") ||
          "";
        if (src) {
          const idx = imageUrls.length;
          imageUrls.push(src);
          const alt = (img.getAttribute("alt") || "").replace(
            /[\]\n]/g,
            " "
          );
          out.push(`![${alt}](__IMAGE_${idx}__)`);
        }
      }
      continue;
    }

    if (classes.includes("se-quotation")) {
      const t = textOf(comp);
      if (t)
        out.push(
          t
            .split("\n")
            .map((l) => `> ${l}`)
            .join("\n")
        );
      continue;
    }

    if (classes.includes("se-list")) {
      const items = comp.querySelectorAll("li");
      for (const li of items) {
        const t = li.text.replace(/\s+/g, " ").trim();
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
