import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  AccessMethod,
  AuthMethod,
  ConsentBasis,
  DataClassification,
  LatencyTolerance,
  LifecycleStage,
  LlmContextEntry,
  NetworkAccess,
  PiiType,
  ProfileReviewStatus,
  RequiredHandling,
  SecurityRole,
  SystemType,
  type Prisma,
} from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { auditedProcedure, protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import {
  createInAppNotification,
  executeStageTransition,
} from "@/server/services/lifecycle-service";
import { PROFILE_REVIEW_SECTIONS } from "./profileReview.shared";

const specialistRoles: SecurityRole[] = [
  SecurityRole.EVALUATOR,
  SecurityRole.DATA_SECURITY_REVIEWER,
  SecurityRole.CUSTOMER_ADMIN,
  SecurityRole.PORTFOLIO_MANAGER,
  SecurityRole.PLATFORM_SUPER_ADMIN,
];

function requireTenantId(ctx: {
  access: NonNullable<
    Awaited<ReturnType<typeof import("../context").createContext>>["access"]
  >;
}) {
  if (!ctx.access.tenantId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Select a tenant context",
    });
  }
  return ctx.access.tenantId;
}

async function maybeAdvanceToPortfolioScoring(
  scopedDb: typeof import("@/server/db/client").prisma,
  useCaseId: string,
  tenantId: string,
  userId: string,
) {
  const reviews = await scopedDb.profileReview.findMany({
    where: { useCaseId },
  });

  const allApproved =
    reviews.length >= PROFILE_REVIEW_SECTIONS.length &&
    PROFILE_REVIEW_SECTIONS.every((section) =>
      reviews.some(
        (r) => r.section === section && r.status === ProfileReviewStatus.APPROVED,
      ),
    );

  if (!allApproved) return;

  const useCase = await scopedDb.useCase.findFirst({ where: { id: useCaseId } });
  if (!useCase || useCase.currentStage !== LifecycleStage.PROFILE_REVIEW) return;

  await executeStageTransition({
    scopedDb,
    useCaseId,
    tenantId,
    userId,
    fromStage: LifecycleStage.PROFILE_REVIEW,
    toStage: LifecycleStage.PORTFOLIO_SCORING,
    gateDecision: "PASS",
    profileReviewsComplete: true,
    notes: "All profile reviews approved",
  });

  const managers = await scopedDb.user.findMany({
    where: {
      tenantId,
      role: {
        in: [SecurityRole.PORTFOLIO_MANAGER, SecurityRole.CUSTOMER_ADMIN],
      },
      isActive: true,
    },
    select: { id: true },
  });

  for (const manager of managers) {
    await createInAppNotification(scopedDb, {
      tenantId,
      userId: manager.id,
      title: "Ready for portfolio scoring",
      message: `${useCase.useCaseNumber} completed all profile reviews.`,
      link: `/scoring/${useCaseId}`,
    });
  }
}

export const profileReviewRouter = createTRPCRouter({
  createAll: auditedProcedure
    .use(roleMiddleware([SecurityRole.PORTFOLIO_MANAGER, SecurityRole.PLATFORM_SUPER_ADMIN]))
    .input(z.object({ useCaseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      for (const section of PROFILE_REVIEW_SECTIONS) {
        const existing = await ctx.scopedDb.profileReview.findFirst({
          where: { useCaseId: input.useCaseId, section },
        });
        if (!existing) {
          await ctx.scopedDb.profileReview.create({
            data: {
              useCaseId: input.useCaseId,
              tenantId,
              section,
            },
          });
        }
      }
      return { ok: true };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      const review = await ctx.scopedDb.profileReview.findFirst({
        where: { id: input.id },
        include: {
          useCase: {
            include: {
              sourceSystemInventory: true,
              sensitiveDataElements: true,
            },
          },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      return review;
    }),

  getMyQueue: protectedProcedure
    .use(roleMiddleware(specialistRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantId(ctx);
      const reviews = await ctx.scopedDb.profileReview.findMany({
        where: {
          tenantId,
          OR: [
            { assignedToId: ctx.user.id },
            { assignedToId: null },
          ],
          status: {
            in: [
              ProfileReviewStatus.PENDING,
              ProfileReviewStatus.IN_REVIEW,
              ProfileReviewStatus.INFO_REQUESTED,
            ],
          },
        },
        include: {
          useCase: {
            select: {
              id: true,
              useCaseNumber: true,
              title: true,
              businessUnit: true,
              dateSubmitted: true,
            },
          },
        },
        orderBy: { id: "asc" },
      });

      const now = Date.now();
      return reviews.map((review) => ({
        ...review,
        daysOpen: Math.floor(
          (now - review.useCase.dateSubmitted.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      }));
    }),

  update: auditedProcedure
    .use(roleMiddleware(specialistRoles))
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ProfileReviewStatus).optional(),
        reviewNotes: z.string().optional(),
        infoRequestDetails: z.string().optional(),
        assignedToId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const existing = await ctx.scopedDb.profileReview.findFirst({
        where: { id: input.id },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.scopedDb.profileReview.update({
        where: { id: input.id },
        data: {
          status: input.status,
          reviewNotes: input.reviewNotes,
          infoRequestDetails: input.infoRequestDetails,
          assignedToId: input.assignedToId ?? ctx.user.id,
          reviewedAt:
            input.status === ProfileReviewStatus.APPROVED ||
            input.status === ProfileReviewStatus.REJECTED
              ? new Date()
              : undefined,
        },
      });

      if (input.status === ProfileReviewStatus.APPROVED) {
        await maybeAdvanceToPortfolioScoring(
          ctx.scopedDb,
          existing.useCaseId,
          tenantId,
          ctx.user.id,
        );
      }

      return updated;
    }),

  sourceSystem: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({ useCaseId: z.string() }))
      .query(async ({ ctx, input }) => {
        requireTenantId(ctx);
        return ctx.scopedDb.sourceSystem.findMany({
          where: { useCaseId: input.useCaseId },
          orderBy: { systemName: "asc" },
        });
      }),

    create: auditedProcedure
      .use(roleMiddleware(specialistRoles))
      .input(
        z.object({
          useCaseId: z.string(),
          systemName: z.string().min(1),
          systemType: z.nativeEnum(SystemType),
          environment: z.string().optional(),
          tablesViewsObjects: z.string().optional(),
          fieldsRequired: z.record(z.string(), z.unknown()).optional(),
          accessMethod: z.nativeEnum(AccessMethod),
          authMethod: z.nativeEnum(AuthMethod).optional(),
          rateLimits: z.string().optional(),
          dataRefreshSla: z.string().optional(),
          sourceOwnerContact: z.string().optional(),
          existingEtl: z.string().optional(),
          networkAccess: z.nativeEnum(NetworkAccess),
          initialLoadVolume: z.string().optional(),
          incrementalVolume: z.string().optional(),
          growthRate: z.string().optional(),
          latencyTolerance: z.nativeEnum(LatencyTolerance),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenantId = requireTenantId(ctx);
        return ctx.scopedDb.sourceSystem.create({
          data: {
            ...input,
            tenantId,
            fieldsRequired: input.fieldsRequired as Prisma.InputJsonValue | undefined,
          },
        });
      }),

    update: auditedProcedure
      .use(roleMiddleware(specialistRoles))
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            systemName: z.string().min(1).optional(),
            systemType: z.nativeEnum(SystemType).optional(),
            environment: z.string().optional(),
            tablesViewsObjects: z.string().optional(),
            fieldsRequired: z.record(z.string(), z.unknown()).optional(),
            accessMethod: z.nativeEnum(AccessMethod).optional(),
            authMethod: z.nativeEnum(AuthMethod).optional(),
            rateLimits: z.string().optional(),
            dataRefreshSla: z.string().optional(),
            sourceOwnerContact: z.string().optional(),
            existingEtl: z.string().optional(),
            networkAccess: z.nativeEnum(NetworkAccess).optional(),
            initialLoadVolume: z.string().optional(),
            incrementalVolume: z.string().optional(),
            growthRate: z.string().optional(),
            latencyTolerance: z.nativeEnum(LatencyTolerance).optional(),
          }),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        requireTenantId(ctx);
        return ctx.scopedDb.sourceSystem.update({
          where: { id: input.id },
          data: {
            ...input.data,
            fieldsRequired: input.data.fieldsRequired as
              | Prisma.InputJsonValue
              | undefined,
          },
        });
      }),

    delete: auditedProcedure
      .use(roleMiddleware(specialistRoles))
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        requireTenantId(ctx);
        await ctx.scopedDb.sourceSystem.delete({ where: { id: input.id } });
        return { ok: true };
      }),
  }),

  sensitiveData: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({ useCaseId: z.string() }))
      .query(async ({ ctx, input }) => {
        requireTenantId(ctx);
        return ctx.scopedDb.sensitiveDataElement.findMany({
          where: { useCaseId: input.useCaseId },
          orderBy: { fieldColumnName: "asc" },
        });
      }),

    create: auditedProcedure
      .use(roleMiddleware(specialistRoles))
      .input(
        z.object({
          useCaseId: z.string(),
          sourceSystemId: z.string().optional(),
          sourceSystemName: z.string().optional(),
          tableObject: z.string().optional(),
          fieldColumnName: z.string().optional(),
          businessMeaning: z.string().optional(),
          dataClassification: z.nativeEnum(DataClassification),
          piiType: z.nativeEnum(PiiType).optional(),
          regulatoryRegime: z.string().optional(),
          entersLlmContext: z.nativeEnum(LlmContextEntry).optional(),
          requiredHandling: z.nativeEnum(RequiredHandling).optional(),
          consentBasis: z.nativeEnum(ConsentBasis).optional(),
          rightToErasure: z.boolean().optional(),
          crossBorderTransfer: z.boolean().optional(),
          transferDestination: z.string().optional(),
          retentionPeriod: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenantId = requireTenantId(ctx);
        return ctx.scopedDb.sensitiveDataElement.create({
          data: { ...input, tenantId },
        });
      }),

    update: auditedProcedure
      .use(roleMiddleware(specialistRoles))
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            sourceSystemId: z.string().optional().nullable(),
            sourceSystemName: z.string().optional(),
            tableObject: z.string().optional(),
            fieldColumnName: z.string().optional(),
            businessMeaning: z.string().optional(),
            dataClassification: z.nativeEnum(DataClassification).optional(),
            piiType: z.nativeEnum(PiiType).optional().nullable(),
            regulatoryRegime: z.string().optional(),
            entersLlmContext: z.nativeEnum(LlmContextEntry).optional().nullable(),
            requiredHandling: z.nativeEnum(RequiredHandling).optional().nullable(),
            consentBasis: z.nativeEnum(ConsentBasis).optional().nullable(),
            rightToErasure: z.boolean().optional(),
            crossBorderTransfer: z.boolean().optional(),
            transferDestination: z.string().optional(),
            retentionPeriod: z.string().optional(),
          }),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        requireTenantId(ctx);
        return ctx.scopedDb.sensitiveDataElement.update({
          where: { id: input.id },
          data: input.data,
        });
      }),

    delete: auditedProcedure
      .use(roleMiddleware(specialistRoles))
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        requireTenantId(ctx);
        await ctx.scopedDb.sensitiveDataElement.delete({
          where: { id: input.id },
        });
        return { ok: true };
      }),
  }),
});
