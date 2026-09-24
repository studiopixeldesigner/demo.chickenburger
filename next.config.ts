import type { NextConfig } from "next";

// Build statique pour GitHub Pages (voir .github/workflows/deploy.yml)
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  ...(isGithubPages && {
    output: 'export',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    trailingSlash: true,
  }),
  images: {
    unoptimized: isGithubPages,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'esrowuwzdbakdythqfsm.supabase.co',
      },
    ],
  },
};

export default nextConfig;
