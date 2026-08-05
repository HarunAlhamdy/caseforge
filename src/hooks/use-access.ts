"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { resolveAccess, canSwitchTenant } from "@/lib/access/resolve-access";
import { SecurityRole } from "@/lib/constants/enums";

export function useAccess() {
  const { data: session } = useSession();

  const access = useMemo(() => {
    if (!session?.user) {
      return null;
    }
    return resolveAccess(session.user);
  }, [session?.user]);

  const hasRole = (...roles: string[]) =>
    access ? roles.includes(access.effectiveRole) : false;

  const isPlatformAdmin = access?.accessLevel === "PLATFORM";
  const isPartnerUser = access?.isPartnerUser ?? false;
  const isCustomerAdmin = hasRole(SecurityRole.CUSTOMER_ADMIN);

  return {
    access,
    hasRole,
    isPlatformAdmin,
    isPartnerUser,
    isCustomerAdmin,
    canSwitchTenant: access ? canSwitchTenant(access) : false,
    isAuthenticated: Boolean(session?.user),
  };
}
