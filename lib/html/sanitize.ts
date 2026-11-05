import sanitizeHtml from "sanitize-html";

// 본문이 HTML인지(마크다운과 구분). 첫 비공백 문자가 '<'면 HTML로 본다.
export function looksLikeHtml(body: string): boolean {
  return /^\s*</.test(body);
}

const YT_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
]);

// 유튜브 embed URL만 통과시키고, 영상 ID + 시작 시간(start)만 남긴 정규형으로
// 다시 만든다. 그 외 iframe src는 null(→ iframe 자체를 제거).
export function canonicalYoutubeEmbed(src?: string): string | null {
  if (!src) return null;
  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !YT_HOSTS.has(u.hostname)) return null;
  const m = u.pathname.match(/^\/embed\/([\w-]{6,20})$/);
  if (!m) return null;
  const start = parseInt(u.searchParams.get("start") ?? "", 10);
  const qs = Number.isFinite(start) && start > 0 ? `?start=${start}` : "";
  return `https://www.youtube-nocookie.com/embed/${m[1]}${qs}`;
}

// 에디터가 만든 서식만 허용하는 화이트리스트 정화. style은 크기·색·정렬만.
// 유튜브 임베드(div[data-youtube-video] > iframe)는 정규형 URL로만 허용.
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
      "div",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      div: ["data-youtube-video"],
      iframe: ["src", "width", "height", "allowfullscreen"],
      "*": ["style"],
    },
    allowedIframeHostnames: ["www.youtube-nocookie.com"],
    exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
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
      iframe: (tagName, attribs) => {
        const src = canonicalYoutubeEmbed(attribs.src);
        if (!src) return { tagName, attribs: {} as Record<string, string> };
        return {
          tagName,
          attribs: { src, width: "640", height: "360", allowfullscreen: "true" },
        };
      },
    },
  });
}
