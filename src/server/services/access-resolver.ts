import type { PartnerRole, PrismaClient, SecurityRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import { PartnerRole as PartnerRoleEnum, SecurityRole as SecurityRoleEnum } from "@/lib/constants/enums";
import type { AccessContext } from "@/lib/types";

export class AccessResolver {
  constructor(private readonly db: PrismaClient) {}

  async resolve(
    session: Session,
    requestedTenantId?: string | null,
  ): Promise<AccessContext> {
    const user = session.user;
    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const userId = user.id;
    const sessionRole = user.role ?? SecurityRoleEnum.VIEWER;

    if (sessionRole === SecurityRoleEnum.PLATFORM_SUPER_ADMIN) {
      return {
        userId,
        tenantId: requestedTenantId ?? user.tenantId ?? null,
        effectiveRole: SecurityRoleEnum.PLATFORM_SUPER_ADMIN,
        partnerId: null,
        partnerRole: null,
        isPartnerUser: false,
        accessLevel: "PLATFORM",
        accessibleTenantIds: [],
      };
    }

    const partnerUser = await this.db.partnerUser.findUnique({
      where: { userId },
      include: {
        customerAssignments: {
          where: { isActive: true },
        },
        partner: {
          include: {
            tenants: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
    });

    if (partnerUser?.isActive) {
      const partnerId = partnerUser.partnerId;
      const partnerRole = partnerUser.partnerRole;

      const accessibleTenantIds =
        partnerRole === PartnerRoleEnum.PARTNER_ADMIN
          ? partnerUser.partner.tenants.map((t) => t.id)
          : Array.from(
              new Set(
                partnerUser.customerAssignments.map((a) => a.tenantId),
              ),
            );

      const effectiveTenantId = this.resolvePartnerTenantId(
        requestedTenantId,
        user.tenantId,
        accessibleTenantIds,
      );

      const effectiveRole = this.resolvePartnerEffectiveRole(
        partnerRole,
        effectiveTenantId,
        partnerUser.customerAssignments,
      );

      return {
        userId,
        tenantId: effectiveTenantId,
        effectiveRole,
        partnerId,
        partnerRole,
        isPartnerUser: true,
        accessLevel: "PARTNER",
        accessibleTenantIds,
      };
    }

    const tenantId = user.tenantId ?? null;
    if (!tenantId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Customer user has no tenant assigned",
      });
    }

    if (
      requestedTenantId !== undefined &&
      requestedTenantId !== null &&
      requestedTenantId !== tenantId
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to requested tenant",
      });
    }

    return {
      userId,
      tenantId,
      effectiveRole: sessionRole,
      partnerId: null,
      partnerRole: null,
      isPartnerUser: false,
      accessLevel: "CUSTOMER",
      accessibleTenantIds: [tenantId],
    };
  }

  /** Returns true when the user may access the given tenant (or cross-customer null). */
  canAccessTenant(access: AccessContext, tenantId: string | null): boolean {
    if (access.accessLevel === "PLATFORM") {
      return true;
    }
    if (tenantId === null) {
      return access.isPartnerUser;
    }
    return access.accessibleTenantIds.includes(tenantId);
  }

  private resolvePartnerTenantId(
    requestedTenantId: string | null | undefined,
    sessionTenantId: string | null | undefined,
    accessibleTenantIds: string[],
  ): string | null {
    const candidate =
      requestedTenantId !== undefined
        ? requestedTenantId
        : (sessionTenantId ?? null);

    if (candidate === null) {
      return null;
    }

    if (!accessibleTenantIds.includes(candidate)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to requested tenant",
      });
    }

    return candidate;
  }

  private resolvePartnerEffectiveRole(
    partnerRole: PartnerRole,
    tenantId: string | null,
    assignments: { tenantId: string; roleInTenant: SecurityRole }[],
  ): SecurityRole {
    if (tenantId === null) {
      return partnerRole === PartnerRoleEnum.PARTNER_ADMIN
        ? SecurityRoleEnum.PARTNER_ADMIN
        : SecurityRoleEnum.PARTNER_CONSULTANT;
    }

    if (partnerRole === PartnerRoleEnum.PARTNER_ADMIN) {
      return SecurityRoleEnum.PARTNER_ADMIN;
    }

    const assignment = assignments.find((a) => a.tenantId === tenantId);
    return assignment?.roleInTenant ?? SecurityRoleEnum.PARTNER_CONSULTANT;
  }
}
