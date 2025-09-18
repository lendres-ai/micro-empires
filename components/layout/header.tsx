import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { DeployButton } from "@/components/deploy-button";
import { hasEnvVars } from "@/lib/utils";

export function Header() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={"/"} className="hover:text-primary transition-colors">
            Micro Empires
          </Link>
          <div className="flex items-center gap-2">
            <DeployButton />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
        </div>
      </div>
    </nav>
  );
}
