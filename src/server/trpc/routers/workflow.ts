import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  ControlStatus,
  LifecycleStage,
  SecurityRole,
  UseCaseStatus,
} from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { auditedProcedure, protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import {
  ensureStage,
  executeStageTransition,
} from "@/server/services/lifecycle-service";

const deliveryRoles: SecurityRole[] = [
  SecurityRole.PORTFOLIO_MANAGER,
  SecurityRole.CUSTOMER_ADMIN,
  SecurityRole.EVALUATOR,
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

export const workflowRouter = createTRPCRouter({
  getWavePlan: protectedProcedure
    .use(roleMiddleware(deliveryRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantId(ctx);
      const useCases = await ctx.scopedDb.useCase.findMany({
        where: {
          tenantId,
          status: UseCaseStatus.ACTIVE,
          currentStage: {
            in: [
              LifecycleStage.WAVE_PLANNING,
              LifecycleStage.DEEP_FEASIBILITY,
              LifecycleStage.PILOT,
            ],
          },
        },
        orderBy: [{ priorityScore: "desc" }, { rank: "asc" }],
      });

      const waves: Record<number | "unassigned", typeof useCases> = {
        unassigned: [],
        1: [],
        2: [],
        3: [],
        4: [],
      };

      for (const uc of useCases) {
        if (uc.wave == null || uc.wave < 1 || uc.wave > 4) {
          waves.unassigned.push(uc);
        } else {
          waves[uc.wave as 1 | 2 | 3 | 4].push(uc);
        }
      }

      return { waves, locked: false };
    }),

  assignWave: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        wave: z.number().min(0).max(4).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      return ctx.scopedDb.useCase.update({
        where: { id: input.useCaseId, tenantId },
        data: { wave: input.wave === 0 ? null : input.wave },
      });
    }),

  confirmWavePlan: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .mutation(async ({ ctx }) => {
      const tenantId = requireTenantId(ctx);
      const unassigned = await ctx.scopedDb.useCase.count({
        where: {
          tenantId,
          currentStage: LifecycleStage.WAVE_PLANNING,
          wave: null,
        },
      });

      if (unassigned > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${unassigned} use case(s) still unassigned to a wave`,
        });
      }

      const waveCases = await ctx.scopedDb.useCase.findMany({
        where: { tenantId, currentStage: LifecycleStage.WAVE_PLANNING },
      });

      for (const uc of waveCases) {
        await executeStageTransition({
          scopedDb: ctx.scopedDb,
          useCaseId: uc.id,
          tenantId,
          userId: ctx.user.id,
          fromStage: LifecycleStage.WAVE_PLANNING,
          toStage: LifecycleStage.PILOT,
          notes: `Assigned to Wave ${uc.wave ?? "?"}`,
        });
      }

      return { confirmed: waveCases.length };
    }),

  getPilot: protectedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId },
        include: {
          successCriteria: true,
          mandatoryControls: true,
          lifecycleEvents: { orderBy: { transitionedAt: "desc" }, take: 10 },
          actionItems: { orderBy: { followUpDate: "desc" } },
        },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const controlsVerified =
        useCase.mandatoryControls.length > 0 &&
        useCase.mandatoryControls.every(
          (c) => c.status === ControlStatus.VERIFIED,
        );

      return { useCase, controlsVerified };
    }),

  updatePilotCriteria: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        criteria: z.array(
          z.object({
            id: z.string(),
            actualResult: z.number().optional(),
            status: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const ownedCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        select: { id: true },
      });
      if (!ownedCase) throw new TRPCError({ code: "NOT_FOUND" });
      for (const c of input.criteria) {
        await ctx.scopedDb.successCriteria.update({
          where: { id: c.id, useCaseId: input.useCaseId },
          data: {
            actualResult: c.actualResult,
            status: c.status as never,
            measuredAt: new Date(),
          },
        });
      }
      return { ok: true };
    }),

  verifyControl: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(
      z.object({
        controlId: z.string(),
        status: z.enum(["REQUIRED", "IMPLEMENTED", "VERIFIED"]),
        implementationNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const control = await ctx.scopedDb.mandatoryControl.findFirst({
        where: { id: input.controlId, tenantId },
      });
      if (!control) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.scopedDb.mandatoryControl.update({
        where: { id: input.controlId },
        data: {
          status: input.status as ControlStatus,
          implementationNotes: input.implementationNotes,
          verifiedById:
            input.status === "VERIFIED" ? ctx.user.id : undefined,
          verifiedAt: input.status === "VERIFIED" ? new Date() : undefined,
        },
      });
    }),

  pilotCheckpoint: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        decision: z.enum([
          "CONTINUE",
          "ADJUST",
          "EXTEND",
          "PAUSE",
          "TERMINATE",
          "GO",
        ]),
        notes: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: { mandatoryControls: true },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.decision === "GO") {
        if (useCase.mandatoryControls.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "At least one mandatory control must exist and be verified before Go",
          });
        }
        const allVerified = useCase.mandatoryControls.every(
          (c) => c.status === ControlStatus.VERIFIED,
        );
        if (!allVerified) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "All mandatory controls must be Verified before Go",
          });
        }
        await ensureStage({
          scopedDb: ctx.scopedDb,
          useCaseId: input.useCaseId,
          tenantId,
          userId: ctx.user.id,
          currentStage: useCase.currentStage,
          targetStage: LifecycleStage.SCALE_UP,
          notes: input.notes,
        });
      } else if (input.decision === "TERMINATE") {
        await ensureStage({
          scopedDb: ctx.scopedDb,
          useCaseId: input.useCaseId,
          tenantId,
          userId: ctx.user.id,
          currentStage: useCase.currentStage,
          targetStage: LifecycleStage.GATED_OUT,
          notes: input.notes,
        });
      } else if (input.decision === "PAUSE") {
        await ensureStage({
          scopedDb: ctx.scopedDb,
          useCaseId: input.useCaseId,
          tenantId,
          userId: ctx.user.id,
          currentStage: useCase.currentStage,
          targetStage: LifecycleStage.ON_HOLD,
          notes: input.notes,
        });
      } else {
        await ctx.scopedDb.lifecycleEvent.create({
          data: {
            useCaseId: input.useCaseId,
            tenantId,
            fromStage: useCase.currentStage,
            toStage: useCase.currentStage,
            transitionedById: ctx.user.id,
            notes: `Pilot checkpoint ${input.decision}: ${input.notes}`,
          },
        });
      }

      return { ok: true };
    }),

  getScaleUp: protectedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      return ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId },
        include: {
          mandatoryControls: true,
          successCriteria: true,
          effortEstimate: true,
        },
      });
    }),

  deployToProduction: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        deploymentDate: z.string(),
        productionScope: z.string(),
        checklistComplete: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      if (!input.checklistComplete) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Readiness checklist must be complete",
        });
      }

      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      await ensureStage({
        scopedDb: ctx.scopedDb,
        useCaseId: input.useCaseId,
        tenantId,
        userId: ctx.user.id,
        currentStage: useCase.currentStage,
        targetStage: LifecycleStage.PRODUCTION,
        notes: `Deploy ${input.deploymentDate}: ${input.productionScope}`,
      });

      return ctx.scopedDb.useCase.findFirst({ where: { id: input.useCaseId } });
    }),

  getOperationsDashboard: protectedProcedure
    .use(roleMiddleware(deliveryRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantId(ctx);
      const production = await ctx.scopedDb.useCase.findMany({
        where: { tenantId, currentStage: LifecycleStage.PRODUCTION },
        include: {
          successCriteria: true,
          financialModel: true,
          mandatoryControls: true,
        },
        orderBy: { title: "asc" },
      });

      return {
        production,
        revalidationDue: production.filter((uc) => {
          const lastEvent = uc.updatedAt;
          const daysSince =
            (Date.now() - lastEvent.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > 90;
        }),
      };
    }),

  getOperationsDetail: protectedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId },
        include: {
          successCriteria: true,
          financialModel: true,
          lifecycleEvents: { orderBy: { transitionedAt: "asc" } },
          actionItems: true,
        },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });
      return useCase;
    }),

  recordMonthlyMetrics: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        accuracy: z.number().optional(),
        costActual: z.number().optional(),
        incidents: z.number().optional(),
        adoptionRate: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      await ctx.scopedDb.actionItem.create({
        data: {
          useCaseId: input.useCaseId,
          tenantId,
          recommendedAction: "Monthly metrics",
          notes: JSON.stringify({
            accuracy: input.accuracy,
            costActual: input.costActual,
            incidents: input.incidents,
            adoptionRate: input.adoptionRate,
            detail: input.notes,
            recordedAt: new Date().toISOString(),
          }),
          status: "METRICS",
          completedAt: new Date(),
        },
      });
      return { ok: true };
    }),

  startRevalidation: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(z.object({ useCaseId: z.string(), notes: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.scopedDb.lifecycleEvent.create({
        data: {
          useCaseId: input.useCaseId,
          tenantId,
          fromStage: useCase.currentStage,
          toStage: useCase.currentStage,
          transitionedById: ctx.user.id,
          notes: `Revalidation started: ${input.notes}`,
        },
      });

      return { ok: true, message: "Revalidation workflow stub recorded" };
    }),

  returnToArchitecture: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        reason: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: { solutionArchitecture: true },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      await executeStageTransition({
        scopedDb: ctx.scopedDb,
        useCaseId: input.useCaseId,
        tenantId,
        userId: ctx.user.id,
        fromStage: useCase.currentStage,
        toStage: LifecycleStage.DEEP_FEASIBILITY,
        notes: `Major change — return to architecture: ${input.reason}`,
      });

      if (useCase.solutionArchitecture) {
        await ctx.scopedDb.solutionArchitecture.update({
          where: { useCaseId: input.useCaseId },
          data: { status: "DRAFT" },
        });
      }

      return ctx.scopedDb.useCase.findFirst({ where: { id: input.useCaseId } });
    }),

  retireUseCase: auditedProcedure
    .use(roleMiddleware(deliveryRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        reason: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      await ensureStage({
        scopedDb: ctx.scopedDb,
        useCaseId: input.useCaseId,
        tenantId,
        userId: ctx.user.id,
        currentStage: useCase.currentStage,
        targetStage: LifecycleStage.RETIRED,
        notes: input.reason,
      });

      await ctx.scopedDb.useCase.update({
        where: { id: input.useCaseId },
        data: { status: UseCaseStatus.CANCELLED },
      });

      return { ok: true };
    }),
});
