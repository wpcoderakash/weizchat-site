import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
// Plugin named as a string so the options stay serializable under Turbopack.
const withMDX = createMDX({ options: { remarkPlugins: ['remark-gfm'] } });

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  poweredByHeader: false,
  /*
   * A self-contained server bundle: `.next/standalone` carries its own
   * minimal node_modules, so the host needs Node and nothing else — no
   * install, no build, no toolchain on a small VPS. See DEPLOY.md; the
   * deploy script also ships `messages/` and `src/content/`, which the
   * bundler cannot see because they are read from disk at runtime.
   */
  output: 'standalone',
  // The tracer walks the project directory; without this it copies a previous
  // release into the next one.
  outputFileTracingExcludes: { '*': ['release/**', '.git/**'] },
};

export default withNextIntl(withMDX(nextConfig));
