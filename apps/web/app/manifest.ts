import type { MetadataRoute } from "next";

// 정적 export 호환 — manifest를 build-time에 한 번 생성
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "도란도란",
    short_name: "도란도란",
    description: "둘이서 도란도란 — 우리만의 언어 일기",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#58CC02",
    categories: ["education", "lifestyle"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
