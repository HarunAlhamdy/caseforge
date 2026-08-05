import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import {
  SecurityRole,
  TenantType,
  type Prisma,
} from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import {
  auditedProcedure,
  protectedProcedure,
} from "../procedures";
import { roleMiddleware } from "../middleware";
import { getGlobalConfig, updateGlobalConfig } from "@/lib/constants/global-config";
import { provisionTenant } from "@/server/services/scoring-model-service";
import type {
  IntakeFormConfig,
  TenantAdminConfigBundle,
  TerminologyOverrides,
} from "@/lib/types";
import { DEFAULT_SCORING_TEMPLATE } from "@/lib/constants/scoring-template";

const customerAdminRoles: SecurityRole[] = [
  SecurityRole.PLATFORM_SUPER_ADMIN,
  SecurityRole.PARTNER_ADMIN,
  SecurityRole.CUSTOMER_ADMIN,
];

function parseTenantAdminConfig(raw: unknown): TenantAdminConfigBundle {
  if (!raw || typeof raw !== "object") return {};
  return raw as TenantAdminConfigBundle;
}

const platformAdminRoles: SecurityRole[] = [
  SecurityRole.PLATFORM_SUPER_ADMIN,
];

function parseIntakeConfig(raw: unknown): IntakeFormConfig {
  const bundle = parseTenantAdminConfig(raw);
  if (bundle.intake) return bundle.intake;
  if (raw && typeof raw === "object" && "sections" in (raw as object)) {
    return raw as IntakeFormConfig;
  }
  return DEFAULT_SCORING_TEMPLATE.intakeFormConfig;
}

function requireTenantScope(ctx: {
  access: NonNullable<Awaited<
    ReturnType<typeof import("../context").createContext>
  >["access"]>;
}) {
  if (ctx.access.accessLevel === "PLATFORM" && !ctx.access.tenantId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Select a tenant context for this operation",
    });
  }
  if (!ctx.access.tenantId && ctx.access.accessLevel === "CUSTOMER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tenant context",
    });
  }
  return ctx.access.tenantId!;
}

export const adminRouter = createTRPCRouter({
  listUsers: protectedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantScope(ctx);

      return ctx.scopedDb.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { name: "asc" },
      });
    }),

  inviteUser: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.nativeEnum(SecurityRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);

      const customerRoles: SecurityRole[] = [
        SecurityRole.CUSTOMER_ADMIN,
        SecurityRole.PORTFOLIO_MANAGER,
        SecurityRole.EVALUATOR,
        SecurityRole.SUBMITTER,
        SecurityRole.DATA_SECURITY_REVIEWER,
        SecurityRole.EXECUTIVE_SPONSOR,
        SecurityRole.VIEWER,
      ];

      if (!customerRoles.includes(input.role)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid role for customer tenant user",
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

      const user = await ctx.scopedDb.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          role: input.role,
          tenantId,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      return { user, tempPassword };
    }),

  updateRole: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(SecurityRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);

      const user = await ctx.scopedDb.user.findFirst({
        where: { id: input.userId, tenantId },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.scopedDb.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
    }),

  deactivateUser: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);

      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot deactivate your own account",
        });
      }

      const user = await ctx.scopedDb.user.findFirst({
        where: { id: input.userId, tenantId },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.scopedDb.user.update({
        where: { id: input.userId },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
    }),

  listPartners: protectedProcedure
    .use(roleMiddleware(platformAdminRoles))
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.partner.findMany({
        where: input?.includeInactive ? {} : { isActive: true },
        select: {
          id: true,
          name: true,
          contactEmail: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
          isActive: true,
          createdAt: true,
          maxCustomers: true,
          maxConsultants: true,
          _count: {
            select: {
              tenants: true,
              partnerUsers: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  createPartner: auditedProcedure
    .use(roleMiddleware(platformAdminRoles))
    .input(
      z.object({
        name: z.string().min(1),
        contactEmail: z.string().email().optional(),
        logoUrl: z.string().url().optional(),
        primaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        maxCustomers: z.number().int().positive().optional(),
        maxConsultants: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.partner.create({ data: input });
    }),

  setPartnerActive: auditedProcedure
    .use(roleMiddleware(platformAdminRoles))
    .input(z.object({ partnerId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.partner.update({
        where: { id: input.partnerId },
        data: { isActive: input.isActive },
      });
    }),

  listTenants: protectedProcedure
    .use(roleMiddleware(platformAdminRoles))
    .query(async ({ ctx }) => {
      return ctx.db.tenant.findMany({
        include: {
          partner: { select: { id: true, name: true } },
          _count: { select: { users: true, useCases: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  createTenant: auditedProcedure
    .use(roleMiddleware(platformAdminRoles))
    .input(
      z.object({
        name: z.string().min(1),
        type: z.nativeEnum(TenantType),
        partnerId: z.string().optional(),
        subscriptionTier: z.string().optional(),
        adminEmail: z.string().email(),
        adminName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === TenantType.PARTNER_MANAGED && !input.partnerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Partner ID required for partner-managed tenants",
        });
      }

      return provisionTenant(ctx.db, input);
    }),

  getGlobalConfig: protectedProcedure
    .use(roleMiddleware(platformAdminRoles))
    .query(() => getGlobalConfig()),

  updateGlobalConfig: auditedProcedure
    .use(roleMiddleware(platformAdminRoles))
    .input(
      z.object({
        modelName: z.string().optional(),
        valueWeightInPriority: z.number().min(0).max(1).optional(),
        feasibilityWeightInPriority: z.number().min(0).max(1).optional(),
        subscriptionTiers: z.array(z.string()).optional(),
        intakeFormConfig: z.record(z.string(), z.unknown()).optional(),
        hardGates: z.array(z.record(z.string(), z.unknown())).optional(),
        feasibilityDimensions: z.array(z.record(z.string(), z.unknown())).optional(),
      }),
    )
    .mutation(({ input }) =>
      updateGlobalConfig(input as Partial<typeof DEFAULT_SCORING_TEMPLATE>),
    ),

  getTenantSettings: protectedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantScope(ctx);
      const tenant = await ctx.scopedDb.tenant.findFirst({
        where: { id: tenantId },
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });

      const bundle = parseTenantAdminConfig(tenant.intakeFormConfig);

      return {
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        accentColor: tenant.accentColor,
        fontFamily: tenant.fontFamily,
        terminologyOverrides: (tenant.terminologyOverrides ??
          {}) as TerminologyOverrides,
        intakeFormConfig: parseIntakeConfig(tenant.intakeFormConfig),
        hardGates: bundle.hardGates ?? DEFAULT_SCORING_TEMPLATE.hardGates,
        notifications: bundle.notifications ?? {
          weightChangeApplied: { email: true, inApp: true },
          weightChangeProposed: { email: true, inApp: true },
          stageTransition: { email: true, inApp: true },
          gateDecision: { email: true, inApp: true },
        },
      };
    }),

  updateTenantSettings: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(
      z.object({
        logoUrl: z.string().nullable().optional(),
        primaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        fontFamily: z.string().optional(),
        terminologyOverrides: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);
      return ctx.scopedDb.tenant.update({
        where: { id: tenantId },
        data: input,
      });
    }),

  updateIntakeFormConfig: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(z.custom<IntakeFormConfig>())
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);
      const tenant = await ctx.scopedDb.tenant.findFirst({
        where: { id: tenantId },
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });

      const bundle = parseTenantAdminConfig(tenant.intakeFormConfig);
      return ctx.scopedDb.tenant.update({
        where: { id: tenantId },
        data: {
          intakeFormConfig: {
            ...bundle,
            intake: input,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }),

  updateHardGateConfig: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(
      z.array(
        z.object({
          gateCode: z.string(),
          gateName: z.string(),
          conditionText: z.string(),
          isActive: z.boolean().optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);
      const tenant = await ctx.scopedDb.tenant.findFirst({
        where: { id: tenantId },
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });

      const bundle = parseTenantAdminConfig(tenant.intakeFormConfig);
      return ctx.scopedDb.tenant.update({
        where: { id: tenantId },
        data: {
          intakeFormConfig: {
            ...bundle,
            hardGates: input,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }),

  updateNotificationConfig: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(z.record(z.string(), z.object({ email: z.boolean(), inApp: z.boolean() })))
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);
      const tenant = await ctx.scopedDb.tenant.findFirst({
        where: { id: tenantId },
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });

      const bundle = parseTenantAdminConfig(tenant.intakeFormConfig);
      return ctx.scopedDb.tenant.update({
        where: { id: tenantId },
        data: {
          intakeFormConfig: {
            ...bundle,
            notifications: input,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }),

  getFeasibilityConfig: protectedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantScope(ctx);
      const model = await ctx.scopedDb.scoringModel.findFirst({
        where: { tenantId, isDefault: true, isActive: true },
        include: {
          dimensions: {
            include: { questions: { orderBy: { displayOrder: "asc" } } },
            orderBy: { displayOrder: "asc" },
          },
        },
      });
      return model?.dimensions ?? [];
    }),

  updateFeasibilityDimension: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(
      z.object({
        dimensionId: z.string(),
        weight: z.number().min(0).max(1).optional(),
        dimensionName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);
      const dimension = await ctx.scopedDb.feasibilityDimension.findFirst({
        where: {
          id: input.dimensionId,
          model: { tenantId, isDefault: true },
        },
      });
      if (!dimension) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.scopedDb.feasibilityDimension.update({
        where: { id: input.dimensionId },
        data: {
          weight: input.weight,
          dimensionName: input.dimensionName,
        },
      });
    }),

  updateFeasibilityQuestion: auditedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(
      z.object({
        questionId: z.string(),
        questionText: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantScope(ctx);
      const question = await ctx.scopedDb.feasibilityQuestion.findFirst({
        where: {
          id: input.questionId,
          dimension: { model: { tenantId, isDefault: true } },
        },
      });
      if (!question) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.scopedDb.feasibilityQuestion.update({
        where: { id: input.questionId },
        data: {
          questionText: input.questionText,
          isActive: input.isActive,
        },
      });
    }),

  listAuditLogs: protectedProcedure
    .use(roleMiddleware(customerAdminRoles))
    .input(
      z
        .object({
          entityType: z.string().optional(),
          userId: z.string().optional(),
          from: z.coerce.date().optional(),
          to: z.coerce.date().optional(),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const tenantId =
        ctx.access!.accessLevel === "PLATFORM"
          ? ctx.access!.tenantId
          : requireTenantScope(ctx);

      const where: {
        tenantId?: string | null;
        entityType?: string;
        userId?: string;
        timestamp?: { gte?: Date; lte?: Date };
      } = {};

      if (tenantId) {
        where.tenantId = tenantId;
      } else if (ctx.access!.accessLevel !== "PLATFORM") {
        where.tenantId = requireTenantScope(ctx);
      }

      if (input?.entityType) where.entityType = input.entityType;
      if (input?.userId) where.userId = input.userId;
      if (input?.from || input?.to) {
        where.timestamp = {};
        if (input.from) where.timestamp.gte = input.from;
        if (input.to) where.timestamp.lte = input.to;
      }

      return ctx.db.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: "desc" },
        take: input?.limit ?? 50,
      });
    }),
});
