import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-full flex justify-center py-10 bg-background">
      {children}
    </div>
  );
}
