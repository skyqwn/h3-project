import type { MDXComponents } from "mdx/types";

// Plain components map — import this for next-mdx-remote's <MDXRemote
// components={mdxComponents} /> in async server components (it is NOT a
// hook, so it doesn't trip react-hooks/rules-of-hooks).
export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-display-lg text-ink mt-0 mb-6">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-heading-xl text-ink mt-14 mb-4 scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-heading-lg text-ink mt-10 mb-3">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-body-md text-body my-4 leading-[1.8]">{children}</p>
  ),
  a: ({ children, href }) => (
    <a
      href={href as string}
      className="text-primary underline underline-offset-2 hover:text-primary-pressed"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 my-4 text-body-md text-body space-y-1.5 leading-[1.7]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 my-4 text-body-md text-body space-y-1.5 leading-[1.7]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  code: ({ children }) => (
    <code className="bg-surface-card rounded px-1.5 py-0.5 text-body-sm">
      {children}
    </code>
  ),
  // Re-hosted Naver photos. width/height come from rehypeImageDimensions
  // (read off the file in public/) so the browser reserves the correct
  // box before the lazy bytes arrive — no layout shift, no Lenis fight.
  // w-full + h-auto keeps it responsive while honoring that aspect ratio.
  img: ({ src, alt, width, height }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src as string}
      alt={(alt as string) || ""}
      width={width as number | undefined}
      height={height as number | undefined}
      loading="lazy"
      decoding="async"
      className="block w-full h-auto my-8 rounded-md border border-hairline-soft bg-surface-card"
    />
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-r-md border-l-4 border-primary bg-surface-card px-5 py-4 text-body-md text-body [&>p]:my-0 [&>p+p]:mt-3">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-12 border-0 border-t border-hairline" />,
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-md border border-hairline">
      <table className="w-full border-collapse text-body-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-surface-card">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-hairline-soft last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="border-r border-hairline-soft px-4 py-3 text-left text-body-strong text-ink last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-r border-hairline-soft px-4 py-3 align-top text-body last:border-r-0">
      {children}
    </td>
  ),
};

// Next.js convention export — used when .mdx files are imported directly
// (file-based MDX). Delegates to the same map above.
export function useMDXComponents(
  components: MDXComponents
): MDXComponents {
  return { ...mdxComponents, ...components };
}
