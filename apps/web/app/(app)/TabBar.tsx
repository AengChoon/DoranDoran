"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Repeat, User } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/feed", label: "피드", Icon: Home },
  { href: "/review", label: "복습", Icon: Repeat },
  { href: "/me", label: "나", Icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-duo-bg border-t border-duo-border"
      aria-label="주요 메뉴"
    >
      <div
        className="max-w-md mx-auto grid grid-cols-3"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5",
                "transition-colors",
                active
                  ? "text-duo-green-dark"
                  : "text-duo-text-muted hover:text-duo-text",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className="h-6 w-6"
                strokeWidth={active ? 2.5 : 2}
                aria-hidden
              />
              <span className="text-[11px] font-extrabold tracking-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
