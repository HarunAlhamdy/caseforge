"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { trpc } from "@/trpc/react";
import { resolveAccess, canSwitchTenant } from "@/lib/access/resolve-access";
import { SecurityRole } from "@/lib/constants/enums";
import type { AccessContext } from "@/lib/types";

export function useAccess() {
  const { data: session } = useSession();
  const { data: serverAccess } = trpc.tenant.myAccess.useQuery(undefined, {
    enabled: Boolean(session?.user),
    staleTime: 30_000,
  });

  const access = useMemo((): AccessContext | null => {
    if (serverAccess) {
      return serverAccess as AccessContext;
    }
    if (!session?.user) {
      return null;
    }
    return resolveAccess(session.user);
  }, [session?.user, serverAccess]);

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
