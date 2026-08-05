"use client";

import { useSession } from "next-auth/react";
import { useAppStore } from "@/stores/app-store";
import { getDefaultTenantTheme } from "@/lib/utils/tenant-theme";
import type { TenantThemeConfig } from "@/lib/types";

export function useTenant() {
  const { data: session } = useSession();
  const { activeTenantId, tenantTheme } = useAppStore();

  const tenantId = activeTenantId ?? session?.user?.tenantId ?? null;
  const theme: TenantThemeConfig = tenantTheme ?? getDefaultTenantTheme();

  return {
    tenantId,
    theme,
    isPartnerContext: !session?.user?.tenantId || activeTenantId !== session.user.tenantId,
  };
}
