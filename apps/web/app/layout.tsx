import type { Metadata, Viewport } from "next";
import { nunito } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "도란도란",
    template: "%s · 도란도란",
  },
  description: "둘이서 도란도란 — 우리만의 언어 일기 PWA",
  applicationName: "도란도란",
  appleWebApp: {
    capable: true,
    title: "도란도란",
    statusBarStyle: "default",
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#58CC02" },
    { media: "(prefers-color-scheme: dark)", color: "#131F24" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={nunito.variable}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-duo-bg text-duo-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
