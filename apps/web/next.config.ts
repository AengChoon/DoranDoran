import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8787";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@dorandoran/shared"],
  },
  transpilePackages: ["@dorandoran/shared"],
  // Turbopack 기본 설정 (dev). Serwist가 Webpack 기반이라
  // 빈 객체로 두면 Next가 "Turbopack 의도적 사용" 인식하고 dev 에러 사라짐.
  turbopack: {},
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
