import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
// Plugin named as a string so the options stay serializable under Turbopack.
const withMDX = createMDX({ options: { remarkPlugins: ['remark-gfm'] } });

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  poweredByHeader: false,
};

export default withNextIntl(withMDX(nextConfig));
