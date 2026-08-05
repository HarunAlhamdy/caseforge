import { SecurityRole } from "@/lib/constants/enums";
import type { AccessContext, SessionUser } from "@/lib/types";

/** Client-side access snapshot from session claims (no DB). */
export function resolveAccess(user: SessionUser): AccessContext {
  const role = user.role ?? SecurityRole.VIEWER;

  if (role === SecurityRole.PLATFORM_SUPER_ADMIN) {
    return {
      userId: user.id,
      tenantId: user.tenantId ?? null,
      effectiveRole: role,
      partnerId: user.partnerId ?? null,
      partnerRole: user.partnerRole ?? null,
      isPartnerUser: false,
      accessLevel: "PLATFORM",
      accessibleTenantIds: user.accessibleTenantIds ?? [],
    };
  }

  if (user.partnerId) {
    const isAdmin = user.partnerRole === "PARTNER_ADMIN";
    return {
      userId: user.id,
      tenantId: user.tenantId ?? null,
      effectiveRole: isAdmin
        ? SecurityRole.PARTNER_ADMIN
        : SecurityRole.PARTNER_CONSULTANT,
      partnerId: user.partnerId,
      partnerRole: user.partnerRole ?? null,
      isPartnerUser: true,
      accessLevel: "PARTNER",
      accessibleTenantIds: user.accessibleTenantIds ?? [],
    };
  }

  return {
    userId: user.id,
    tenantId: user.tenantId ?? null,
    effectiveRole: role,
    partnerId: null,
    partnerRole: null,
    isPartnerUser: false,
    accessLevel: "CUSTOMER",
    accessibleTenantIds: user.tenantId ? [user.tenantId] : [],
  };
}

export function canSwitchTenant(access: AccessContext): boolean {
  return access.accessLevel === "PLATFORM" || access.isPartnerUser;
}
