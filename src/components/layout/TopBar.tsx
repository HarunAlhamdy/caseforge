"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { TenantSwitcher } from "./TenantSwitcher";
import { useAccess } from "@/hooks/use-access";

export function TopBar() {
  const { data: session } = useSession();
  const { canSwitchTenant } = useAccess();

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-5">
      <div className="flex items-center gap-3">
        {canSwitchTenant ? <TenantSwitcher /> : null}
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />

        <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-2.5 py-1 text-sm text-stone-700">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-teal-300">
            <User className="h-3.5 w-3.5" aria-hidden />
          </div>
          <span className="hidden font-semibold text-stone-800 sm:block">
            {session?.user?.name ?? session?.user?.email ?? "User"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Sign out"
          className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </header>
  );
}
