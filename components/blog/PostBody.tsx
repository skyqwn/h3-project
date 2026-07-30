import Image from "next/image";
import parse, {
  domToReact,
  Element,
  type HTMLReactParserOptions,
  type DOMNode,
} from "html-react-parser";

function toNum(v?: string): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

const imgCls =
  "mx-auto block h-auto max-w-full my-8 rounded-md border border-hairline-soft bg-surface-card";

// "font-size:20px;color:#f00;text-align:center" → React style 객체(허용된 것만).
function styleObj(style?: string): React.CSSProperties | undefined {
  if (!style) return undefined;
  const out: Record<string, string> = {};
  for (const decl of style.split(";")) {
    const [k, v] = decl.split(":").map((x) => x?.trim());
    if (!k || !v) continue;
    if (k === "font-size") out.fontSize = v;
    else if (k === "color") out.color = v;
    else if (k === "text-align") out.textAlign = v;
  }
  return Object.keys(out).length ? (out as React.CSSProperties) : undefined;
}

const options: HTMLReactParserOptions = {
  replace: (node) => {
    if (!(node instanceof Element)) return undefined;
    const kids = () => domToReact(node.children as DOMNode[], options);
    const style = node.attribs?.style;
    switch (node.name) {
      case "img": {
        const { src, alt } = node.attribs;
        const w = toNum(node.attribs.width);
        const h = toNum(node.attribs.height);
        if (src && w && h) {
          return (
            <Image
              src={src}
              alt={alt || ""}
              width={w}
              height={h}
              sizes="(min-width: 800px) 768px, 100vw"
              className={imgCls}
            />
          );
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt || ""} loading="lazy" className={imgCls} />
        );
      }
      case "h1":
        return (
          <h1 className="text-display-lg text-ink mt-0 mb-6" style={styleObj(style)}>
            {kids()}
          </h1>
        );
      case "h2":
        return (
          <h2
            className="text-heading-xl text-ink mt-14 mb-4 scroll-mt-24"
            style={styleObj(style)}
          >
            {kids()}
          </h2>
        );
      case "h3":
        return (
          <h3 className="text-heading-lg text-ink mt-10 mb-3" style={styleObj(style)}>
            {kids()}
          </h3>
        );
      case "p":
        return (
          <p
            className="text-body-md text-body my-4 leading-[1.8]"
            style={styleObj(style)}
          >
            {kids()}
          </p>
        );
      case "ul":
        return (
          <ul className="list-disc pl-6 my-4 text-body-md text-body space-y-1.5 leading-[1.7]">
            {kids()}
          </ul>
        );
      case "ol":
        return (
          <ol className="list-decimal pl-6 my-4 text-body-md text-body space-y-1.5 leading-[1.7]">
            {kids()}
          </ol>
        );
      case "blockquote":
        return (
          <blockquote className="my-6 rounded-r-md border-l-4 border-primary bg-surface-card px-5 py-4 text-body-md text-body [&>p]:my-0 [&>p+p]:mt-3">
            {kids()}
          </blockquote>
        );
      case "a":
        return (
          <a
            href={node.attribs.href}
            target={node.attribs.target}
            rel={node.attribs.rel}
            className="text-primary underline underline-offset-2 hover:text-primary-pressed"
          >
            {kids()}
          </a>
        );
      case "code":
        return (
          <code className="bg-surface-card rounded px-1.5 py-0.5 text-body-sm">
            {kids()}
          </code>
        );
      case "hr":
        return <hr className="my-12 border-0 border-t border-hairline" />;
      case "span":
        return <span style={styleObj(style)}>{kids()}</span>;
      case "table":
        return (
          <div className="my-8 overflow-x-auto rounded-md border border-hairline">
            <table className="w-full border-collapse text-body-sm">
              {kids()}
            </table>
          </div>
        );
      case "thead":
        return <thead className="bg-surface-card">{kids()}</thead>;
      case "tr":
        return (
          <tr className="border-b border-hairline-soft last:border-0">
            {kids()}
          </tr>
        );
      case "th":
        return (
          <th className="border-r border-hairline-soft px-4 py-3 text-left text-body-strong text-ink last:border-r-0">
            {kids()}
          </th>
        );
      case "td":
        return (
          <td className="border-r border-hairline-soft px-4 py-3 align-top text-body last:border-r-0">
            {kids()}
          </td>
        );
      default:
        return undefined; // li, strong, em, u, s, br, pre 등은 기본 렌더
    }
  },
};

// 정화된 본문 HTML을 사이트 타이포그래피로 렌더한다.
export function PostBody({ html }: { html: string }) {
  return <>{parse(html, options)}</>;
}
