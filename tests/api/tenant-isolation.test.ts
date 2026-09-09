import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import { AccessResolver } from "@/server/services/access-resolver";
import { SecurityRole, PartnerRole } from "@/lib/constants/enums";

function buildSession(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: new Date(Date.now() + 3600_000).toISOString(),
    user: {
      id: "user-1",
      email: "user@test.com",
      name: "Test User",
      role: SecurityRole.VIEWER,
      tenantId: "tenant-a",
      partnerId: null,
      partnerRole: null,
      accessibleTenantIds: ["tenant-a"],
      ...overrides,
    },
  };
}

function mockDb(
  partnerUser: unknown = null,
  userOverrides: { role?: string; tenantId?: string | null; isActive?: boolean } = {},
) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        isActive: userOverrides.isActive ?? true,
        role: userOverrides.role ?? SecurityRole.VIEWER,
        tenantId: userOverrides.tenantId ?? "tenant-a",
      }),
    },
    partnerUser: {
      findUnique: vi.fn().mockResolvedValue(partnerUser),
    },
  } as unknown as ConstructorParameters<typeof AccessResolver>[0];
}

describe("AccessResolver tenant isolation", () => {
  it("allows platform admin to access any tenant", async () => {
    const resolver = new AccessResolver(
      mockDb(null, {
        role: SecurityRole.PLATFORM_SUPER_ADMIN,
        tenantId: null,
      }),
    );
    const session = buildSession({
      role: SecurityRole.PLATFORM_SUPER_ADMIN,
      tenantId: null,
      accessibleTenantIds: [],
    });

    const access = await resolver.resolve(session, "tenant-b");

    expect(access.accessLevel).toBe("PLATFORM");
    expect(access.tenantId).toBe("tenant-b");
    expect(access.effectiveRole).toBe(SecurityRole.PLATFORM_SUPER_ADMIN);
  });

  it("denies consultant access to tenant B when only assigned to A", async () => {
    const partnerUser = {
      partnerId: "partner-1",
      partnerRole: PartnerRole.PARTNER_CONSULTANT,
      isActive: true,
      customerAssignments: [
        { tenantId: "tenant-a", roleInTenant: SecurityRole.EVALUATOR },
      ],
      partner: { tenants: [{ id: "tenant-a" }, { id: "tenant-b" }] },
    };

    const resolver = new AccessResolver(mockDb(partnerUser));
    const session = buildSession({
      role: SecurityRole.PARTNER_CONSULTANT,
      partnerId: "partner-1",
      partnerRole: PartnerRole.PARTNER_CONSULTANT,
      tenantId: null,
      accessibleTenantIds: ["tenant-a"],
    });

    await expect(resolver.resolve(session, "tenant-b")).rejects.toBeInstanceOf(
      TRPCError,
    );

    const access = await resolver.resolve(session, "tenant-a");
    expect(access.tenantId).toBe("tenant-a");
    expect(access.effectiveRole).toBe(SecurityRole.EVALUATOR);
    expect(access.accessibleTenantIds).toEqual(["tenant-a"]);
  });

  it("denies customer user access to another tenant", async () => {
    const resolver = new AccessResolver(mockDb(null));
    const session = buildSession({
      role: SecurityRole.CUSTOMER_ADMIN,
      tenantId: "tenant-a",
      accessibleTenantIds: ["tenant-a"],
    });

    await expect(resolver.resolve(session, "tenant-b")).rejects.toBeInstanceOf(
      TRPCError,
    );

    const access = await resolver.resolve(session, "tenant-a");
    expect(access.accessLevel).toBe("CUSTOMER");
    expect(access.tenantId).toBe("tenant-a");
  });

  it("grants partner admin all partner tenants", async () => {
    const partnerUser = {
      partnerId: "partner-1",
      partnerRole: PartnerRole.PARTNER_ADMIN,
      isActive: true,
      customerAssignments: [],
      partner: {
        tenants: [{ id: "tenant-a" }, { id: "tenant-b" }],
      },
    };

    const resolver = new AccessResolver(mockDb(partnerUser));
    const session = buildSession({
      role: SecurityRole.PARTNER_ADMIN,
      partnerId: "partner-1",
      partnerRole: PartnerRole.PARTNER_ADMIN,
      tenantId: null,
      accessibleTenantIds: ["tenant-a", "tenant-b"],
    });

    const access = await resolver.resolve(session, "tenant-b");
    expect(access.isPartnerUser).toBe(true);
    expect(access.accessibleTenantIds).toEqual(["tenant-a", "tenant-b"]);
    expect(access.effectiveRole).toBe(SecurityRole.PARTNER_ADMIN);
  });

  it("supports cross-customer view for partner users", async () => {
    const partnerUser = {
      partnerId: "partner-1",
      partnerRole: PartnerRole.PARTNER_ADMIN,
      isActive: true,
      customerAssignments: [],
      partner: { tenants: [{ id: "tenant-a" }] },
    };

    const resolver = new AccessResolver(mockDb(partnerUser));
    const session = buildSession({
      role: SecurityRole.PARTNER_ADMIN,
      partnerId: "partner-1",
      partnerRole: PartnerRole.PARTNER_ADMIN,
      tenantId: null,
    });

    const access = await resolver.resolve(session, null);
    expect(access.tenantId).toBeNull();
    expect(access.effectiveRole).toBe(SecurityRole.PARTNER_ADMIN);
  });
});

describe("canSwitchTenant (client helper)", () => {
  it("returns true for partner users via access flags", async () => {
    const { canSwitchTenant } = await import("@/lib/access/resolve-access");
    expect(
      canSwitchTenant({
        userId: "u1",
        tenantId: null,
        effectiveRole: SecurityRole.PARTNER_ADMIN,
        partnerId: "p1",
        partnerRole: PartnerRole.PARTNER_ADMIN,
        isPartnerUser: true,
        accessLevel: "PARTNER",
        accessibleTenantIds: ["tenant-a"],
      }),
    ).toBe(true);
  });
});
