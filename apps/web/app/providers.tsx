"use client";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { installAutoSync, syncDelta } from "@/lib/local/sync";
import { LocaleProvider, useLocale } from "@/lib/i18n";
import { useMe } from "@/lib/api/me";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();

  // 클라이언트 마운트 시 1회 sync + 포커스/온라인 자동 sync 등록
  React.useEffect(() => {
    void syncDelta();
    return installAutoSync();
  }, []);

  return (
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <LocaleSync />
        {children}
      </LocaleProvider>
    </QueryClientProvider>
  );
}

/**
 * 로그인 상태가 되면 user.nativeLang을 locale로 동기화 — 한 번 로그인하면
 * 본인 모국어로 자동 전환. 비로그인 / 로딩 상태에선 사용자가 고른 locale 유지.
 */
function LocaleSync() {
  const me = useMe();
  const { locale, setLocale } = useLocale();
  const native = me.user?.nativeLang;
  React.useEffect(() => {
    if (native && native !== locale) setLocale(native);
  }, [native, locale, setLocale]);
  return null;
}
