/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 아바타 — path-versioned URL이라 immutable. CacheFirst로 한 번 받으면 끝.
    // (defaultCache의 image matcher는 SWR이라 매번 background revalidate가 일어남)
    {
      matcher: ({ url }) => url.pathname.startsWith("/avatars/"),
      handler: new CacheFirst({
        cacheName: "avatars",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1년
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// Web Push 핸들러 (다음 단계에서 채울 자리)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; url?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "도란도란", body: event.data.text() };
  }
  const title = payload.title ?? "도란도란";
  const options: NotificationOptions = {
    body: payload.body ?? "",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: { url: payload.url ?? "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | null)?.url ?? "/";
  event.waitUntil(self.clients.openWindow(url));
});
