"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { ReactNode } from "react";

export function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth");

  if (isAuthRoute) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-5xl p-5 flex items-center justify-center">
          {children}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-10 items-center">
        <Header />
        <div className="flex-1 flex flex-col gap-10 max-w-5xl p-5">{children}</div>
        <Footer />
      </div>
    </main>
  );
}

