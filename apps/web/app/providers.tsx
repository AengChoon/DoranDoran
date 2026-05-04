"use client";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { installAutoSync, syncDelta } from "@/lib/local/sync";

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

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
