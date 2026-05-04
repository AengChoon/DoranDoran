import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // 정적 export — `next build` 시 apps/web/out/ 생성. S3 + CloudFront로 호스팅.
  output: "export",
  reactStrictMode: true,
  // 정적 export는 Next.js Image Optimization API 사용 불가 — 원본 그대로 서빙
  images: { unoptimized: true },
  // 정적 export 시 trailing slash로 디렉토리 구조 (S3 라우팅 호환)
  trailingSlash: true,
  experimental: {
    optimizePackageImports: ["@dorandoran/shared"],
  },
  transpilePackages: ["@dorandoran/shared"],
  // Turbopack 기본 설정 (dev). Serwist가 Webpack 기반이라
  // 빈 객체로 두면 Next가 "Turbopack 의도적 사용" 인식하고 dev 에러 사라짐.
  turbopack: {},
};

export default withSerwist(nextConfig);
