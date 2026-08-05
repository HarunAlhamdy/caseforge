import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { PartnerRole, SecurityRole } from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import {
  auditedProcedure,
  protectedProcedure,
} from "../procedures";
import { roleMiddleware } from "../middleware";

const partnerAdminRoles: SecurityRole[] = [
  SecurityRole.PLATFORM_SUPER_ADMIN,
  SecurityRole.PARTNER_ADMIN,
];

export const partnerRouter = createTRPCRouter({
  listConsultants: protectedProcedure
    .use(roleMiddleware(partnerAdminRoles))
    .query(async ({ ctx }) => {
      const partnerId = ctx.access!.partnerId ?? ctx.user.partnerId;
      if (!partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner context required",
        });
      }

      return ctx.db.partnerUser.findMany({
        where: { partnerId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              isActive: true,
              lastLoginAt: true,
            },
          },
          customerAssignments: {
            where: { isActive: true },
            include: {
              tenant: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      });
    }),

  listAssignments: protectedProcedure
    .use(roleMiddleware(partnerAdminRoles))
    .query(async ({ ctx }) => {
      const partnerId = ctx.access!.partnerId ?? ctx.user.partnerId;
      if (!partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner context required",
        });
      }

      return ctx.db.customerAssignment.findMany({
        where: { partnerId, isActive: true },
        include: {
          tenant: { select: { id: true, name: true } },
          partnerUser: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      });
    }),

  assignConsultant: auditedProcedure
    .use(roleMiddleware(partnerAdminRoles))
    .input(
      z.object({
        partnerUserId: z.string(),
        tenantId: z.string(),
        roleInTenant: z.nativeEnum(SecurityRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const partnerId = ctx.access!.partnerId ?? ctx.user.partnerId;
      if (!partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner context required",
        });
      }

      const partnerUser = await ctx.db.partnerUser.findFirst({
        where: {
          id: input.partnerUserId,
          partnerId,
          partnerRole: PartnerRole.PARTNER_CONSULTANT,
          isActive: true,
        },
      });
      if (!partnerUser) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const tenant = await ctx.db.tenant.findFirst({
        where: { id: input.tenantId, partnerId, isActive: true },
      });
      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found under partner",
        });
      }

      const existing = await ctx.db.customerAssignment.findFirst({
        where: {
          partnerUserId: input.partnerUserId,
          tenantId: input.tenantId,
          isActive: true,
        },
      });
      if (existing) {
        const updated = await ctx.db.customerAssignment.update({
          where: { id: existing.id },
          data: { roleInTenant: input.roleInTenant },
        });
        return updated;
      }

      const assignment = await ctx.db.customerAssignment.create({
        data: {
          partnerId,
          partnerUserId: input.partnerUserId,
          tenantId: input.tenantId,
          roleInTenant: input.roleInTenant,
          assignedBy: ctx.user.id,
        },
      });

      const { notifyConsultantAssignment } = await import(
        "@/server/services/notification-service"
      );
      await notifyConsultantAssignment(ctx.db, {
        tenantId: input.tenantId,
        consultantUserId: partnerUser.userId,
        customerName: tenant.name,
        roleInTenant: input.roleInTenant,
      });

      return assignment;
    }),

  listTenants: protectedProcedure
    .use(roleMiddleware(partnerAdminRoles))
    .query(async ({ ctx }) => {
      const partnerId = ctx.access!.partnerId ?? ctx.user.partnerId;
      if (!partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner context required",
        });
      }

      return ctx.db.tenant.findMany({
        where: { partnerId, isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          subscriptionTier: true,
          _count: { select: { useCases: true, users: true } },
        },
        orderBy: { name: "asc" },
      });
    }),

  inviteConsultant: auditedProcedure
    .use(roleMiddleware(partnerAdminRoles))
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        partnerRole: z.nativeEnum(PartnerRole).default(PartnerRole.PARTNER_CONSULTANT),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const partnerId = ctx.access!.partnerId ?? ctx.user.partnerId;
      if (!partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner context required",
        });
      }

      const existing = await ctx.db.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const tempPassword = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await ctx.db.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          role:
            input.partnerRole === PartnerRole.PARTNER_ADMIN
              ? SecurityRole.PARTNER_ADMIN
              : SecurityRole.PARTNER_CONSULTANT,
          passwordHash,
        },
      });

      const partnerUser = await ctx.db.partnerUser.create({
        data: {
          partnerId,
          userId: user.id,
          partnerRole: input.partnerRole,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, isActive: true },
          },
        },
      });

      return { partnerUser, tempPassword };
    }),

  deactivateConsultant: auditedProcedure
    .use(roleMiddleware(partnerAdminRoles))
    .input(z.object({ partnerUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const partnerId = ctx.access!.partnerId ?? ctx.user.partnerId;
      if (!partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner context required",
        });
      }

      const partnerUser = await ctx.db.partnerUser.findFirst({
        where: { id: input.partnerUserId, partnerId },
      });
      if (!partnerUser) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.partnerUser.update({
        where: { id: partnerUser.id },
        data: { isActive: false },
      });

      return ctx.db.user.update({
        where: { id: partnerUser.userId },
        data: { isActive: false },
      });
    }),

  getPartnerSettings: protectedProcedure
    .use(roleMiddleware(partnerAdminRoles))
    .query(async ({ ctx }) => {
      const partnerId = ctx.access!.partnerId ?? ctx.user.partnerId;
      if (!partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner context required",
        });
      }

      return ctx.db.partner.findUniqueOrThrow({
        where: { id: partnerId },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
          contactEmail: true,
          maxCustomers: true,
          maxConsultants: true,
        },
      });
    }),

  updatePartnerSettings: auditedProcedure
    .use(roleMiddleware(partnerAdminRoles))
    .input(
      z.object({
        name: z.string().min(1).optional(),
        logoUrl: z.string().nullable().optional(),
        primaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        contactEmail: z.string().email().nullable().optional(),
        maxCustomers: z.number().int().positive().nullable().optional(),
        maxConsultants: z.number().int().positive().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const partnerId = ctx.access!.partnerId ?? ctx.user.partnerId;
      if (!partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Partner context required",
        });
      }

      return ctx.db.partner.update({
        where: { id: partnerId },
        data: input,
      });
    }),
});
