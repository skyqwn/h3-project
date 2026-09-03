import sanitizeHtml from "sanitize-html";

// 본문이 HTML인지(마크다운과 구분). 첫 비공백 문자가 '<'면 HTML로 본다.
export function looksLikeHtml(body: string): boolean {
  return /^\s*</.test(body);
}

// 에디터가 만든 서식만 허용하는 화이트리스트 정화. style은 크기·색·정렬만.
export function sanitizeBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "span",
      "code",
      "pre",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        "font-size": [/^\d{1,3}px$/],
        color: [
          /^#(0x)?[0-9a-fA-F]{3,8}$/,
          /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
        ],
        "text-align": [/^(left|center|right)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        const out: Record<string, string> = { href: attribs.href ?? "" };
        if (attribs.target === "_blank") {
          out.target = "_blank";
          out.rel = "noopener nofollow";
        }
        return { tagName, attribs: out };
      },
    },
  });
}
