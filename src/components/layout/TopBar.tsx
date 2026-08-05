"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { TenantSwitcher } from "./TenantSwitcher";
import { useAccess } from "@/hooks/use-access";
import { Button } from "@/components/ui/Button";

export function TopBar() {
  const { data: session } = useSession();
  const { canSwitchTenant } = useAccess();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          CF
        </div>
        {canSwitchTenant ? <TenantSwitcher /> : null}
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-700">
          <User className="h-4 w-4" aria-hidden />
          <span>{session?.user?.name ?? session?.user?.email ?? "User"}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
