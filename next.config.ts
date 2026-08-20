import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withMDX = createMDX({});

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  poweredByHeader: false,
};

export default withNextIntl(withMDX(nextConfig));
