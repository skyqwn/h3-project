import type { MDXComponents } from "mdx/types";

// Plain components map — import this for next-mdx-remote's <MDXRemote
// components={mdxComponents} /> in async server components (it is NOT a
// hook, so it doesn't trip react-hooks/rules-of-hooks).
export const mdxComponents: MDXComponents = {
    h1: ({ children }) => (
      <h1 className="text-display-lg text-ink mb-6">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-heading-xl text-ink mt-12 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-heading-lg text-ink mt-8 mb-3">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-body-md text-body my-3 leading-relaxed">{children}</p>
    ),
    a: ({ children, href }) => (
      <a href={href as string} className="text-ink-soft underline">
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 my-3 text-body-md text-body space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 my-3 text-body-md text-body space-y-1">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    code: ({ children }) => (
      <code className="bg-surface-card rounded px-1 py-0.5 text-body-sm">
        {children}
      </code>
    ),
};

// Next.js convention export — used when .mdx files are imported directly
// (file-based MDX). Delegates to the same map above.
export function useMDXComponents(
  components: MDXComponents
): MDXComponents {
  return { ...mdxComponents, ...components };
}
