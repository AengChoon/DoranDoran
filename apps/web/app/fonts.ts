import { Nunito } from "next/font/google";

export const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

/**
 * Pretendard (한글) + M PLUS Rounded 1c (일본어)는 globals.css에서
 * CDN @import로 로드. CJK 폰트는 글자가 많아 next/font 정적 서브셋이
 * 한자까지 다 못 잡아주는 경우가 있어 CDN 방식이 더 안정적.
 */
