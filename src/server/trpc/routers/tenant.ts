import { z } from "zod";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "../trpc";
import { protectedProcedure } from "../procedures";
import { ACTIVE_TENANT_COOKIE } from "../context";
import { AccessResolver } from "@/server/services/access-resolver";
import { getTenantTheme } from "@/server/services/tenant-service";

export const tenantRouter = createTRPCRouter({
  listAccessible: protectedProcedure.query(async ({ ctx }) => {
    const access = ctx.access!;
    const tenantIds =
      access.accessLevel === "PLATFORM"
        ? (
            await ctx.db.tenant.findMany({
              where: { isActive: true },
              select: { id: true },
            })
          ).map((t) => t.id)
        : access.accessibleTenantIds;

    if (tenantIds.length === 0 && access.accessLevel !== "PLATFORM") {
      return [];
    }

    const tenants = await ctx.db.tenant.findMany({
      where:
        access.accessLevel === "PLATFORM"
          ? { isActive: true }
          : { id: { in: tenantIds }, isActive: true },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
      },
      orderBy: { name: "asc" },
    });

    const roleByTenant = new Map<string, string>();
    if (access.isPartnerUser && access.partnerId) {
      const partnerUser = await ctx.db.partnerUser.findUnique({
        where: { userId: ctx.user.id },
        include: {
          customerAssignments: { where: { isActive: true } },
        },
      });

      for (const tenant of tenants) {
        if (access.partnerRole === "PARTNER_ADMIN") {
          roleByTenant.set(tenant.id, "PARTNER_ADMIN");
        } else {
          const assignment = partnerUser?.customerAssignments.find(
            (a) => a.tenantId === tenant.id,
          );
          roleByTenant.set(
            tenant.id,
            assignment?.roleInTenant ?? "PARTNER_CONSULTANT",
          );
        }
      }
    }

    return tenants.map((tenant) => ({
      ...tenant,
      roleInTenant: roleByTenant.get(tenant.id) ?? access.effectiveRole,
    }));
  }),

  setActive: protectedProcedure
    .input(
      z.object({
        tenantId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const resolver = new AccessResolver(ctx.db);
      const access = await resolver.resolve(ctx.session, input.tenantId);

      if (
        input.tenantId !== null &&
        !resolver.canAccessTenant(access, input.tenantId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot switch to this tenant",
        });
      }

      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_TENANT_COOKIE, input.tenantId ?? "cross", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });

      const theme = await getTenantTheme(input.tenantId);

      return {
        tenantId: access.tenantId,
        effectiveRole: access.effectiveRole,
        theme,
      };
    }),
});
