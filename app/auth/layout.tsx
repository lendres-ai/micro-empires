import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center py-10">{children}</div>
  );
}
