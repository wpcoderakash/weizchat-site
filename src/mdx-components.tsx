import type { MDXComponents } from 'mdx/types';

/** Required by @next/mdx in the App Router; styling comes from .legal-prose. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return components;
}
