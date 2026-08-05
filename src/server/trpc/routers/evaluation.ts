import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  CompositeVerdict,
  HardGateStatus,
  LifecycleStage,
  SecurityRole,
  type Prisma,
} from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { auditedProcedure, protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import {
  calculateCompositeFeasibility,
  calculateDimensionAverage,
  determineVerdict,
} from "@/lib/scoring/feasibility-scoring";
import { buildFeasibilityEvidencePrefill } from "@/lib/scoring/evidence-prefill";
import {
  DEFAULT_FEASIBILITY_QUESTIONS,
  DEFAULT_HARD_GATES,
  FEASIBILITY_DIMENSION_WEIGHTS,
} from "@/lib/constants/seed-data";
import { getOrCreateDefaultScoringModel } from "@/server/services/scoring-model-service";
import { ensureStage } from "@/server/services/lifecycle-service";

const evalRoles: SecurityRole[] = [
  SecurityRole.EVALUATOR,
  SecurityRole.PORTFOLIO_MANAGER,
  SecurityRole.CUSTOMER_ADMIN,
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

async function ensureFeasibilityQuestions(
  scopedDb: Prisma.TransactionClient | typeof import("@/server/db/client").prisma,
  tenantId: string,
) {
  const model = await getOrCreateDefaultScoringModel(scopedDb as never, tenantId);
  const existingCount = await scopedDb.feasibilityQuestion.count({
    where: { dimension: { modelId: model.id } },
  });

  if (existingCount >= DEFAULT_FEASIBILITY_QUESTIONS.length) return model;

  for (const dimCode of Object.keys(FEASIBILITY_DIMENSION_WEIGHTS)) {
    let dimension = await scopedDb.feasibilityDimension.findFirst({
      where: { modelId: model.id, dimensionCode: dimCode },
    });
    if (!dimension) {
      dimension = await scopedDb.feasibilityDimension.create({
        data: {
          modelId: model.id,
          dimensionCode: dimCode,
          dimensionName: dimCode,
          weight: FEASIBILITY_DIMENSION_WEIGHTS[dimCode] ?? 0.1,
        },
      });
    }

    const questions = DEFAULT_FEASIBILITY_QUESTIONS.filter(
      (q) => q.dimensionCode === dimCode,
    );
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const exists = await scopedDb.feasibilityQuestion.findFirst({
        where: { dimensionId: dimension.id, questionText: q.questionText },
      });
      if (!exists) {
        await scopedDb.feasibilityQuestion.create({
          data: {
            dimensionId: dimension.id,
            questionText: q.questionText,
            displayOrder: i,
          },
        });
      }
    }
  }

  return model;
}

async function ensureHardGates(
  scopedDb: Prisma.TransactionClient | typeof import("@/server/db/client").prisma,
  useCaseId: string,
  tenantId: string,
) {
  const existing = await scopedDb.hardGate.count({ where: { useCaseId } });
  if (existing >= DEFAULT_HARD_GATES.length) return;

  for (const gate of DEFAULT_HARD_GATES) {
    const found = await scopedDb.hardGate.findFirst({
      where: { useCaseId, gateCode: gate.gateCode },
    });
    if (!found) {
      await scopedDb.hardGate.create({
        data: {
          useCaseId,
          tenantId,
          gateCode: gate.gateCode,
          gateName: gate.gateName,
          conditionText: gate.conditionText,
        },
      });
    }
  }
}

export const evaluationRouter = createTRPCRouter({
  getAssessment: protectedProcedure
    .use(roleMiddleware(evalRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      await ensureFeasibilityQuestions(ctx.scopedDb, tenantId);

      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const model = await getOrCreateDefaultScoringModel(ctx.db, tenantId);
      const dimensions = await ctx.scopedDb.feasibilityDimension.findMany({
        where: { modelId: model.id },
        include: {
          questions: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      });

      const assessments = await ctx.scopedDb.feasibilityAssessment.findMany({
        where: { useCaseId: input.useCaseId },
      });
      const assessmentByQuestion = new Map(
        assessments.map((a) => [a.questionId, a]),
      );

      const dimensionSummaries = dimensions.map((dim) => {
        const scores = dim.questions
          .map((q) => assessmentByQuestion.get(q.id)?.score ?? 0)
          .filter((s) => s > 0);
        const avg = calculateDimensionAverage(scores);
        return {
          dimensionCode: dim.dimensionCode,
          dimensionName: dim.dimensionName,
          weight: dim.weight,
          avg,
          questions: dim.questions.map((q) => ({
            ...q,
            assessment: assessmentByQuestion.get(q.id) ?? null,
            evidencePrefill: buildFeasibilityEvidencePrefill(
              q.questionText,
              useCase as unknown as Record<string, unknown>,
            ),
          })),
        };
      });

      const composite = calculateCompositeFeasibility(
        dimensionSummaries.map((d) => ({ weight: d.weight, avg: d.avg })),
      );
      const verdict = composite > 0 ? determineVerdict(composite) : null;

      return {
        useCase,
        dimensions: dimensionSummaries,
        composite,
        verdict,
      };
    }),

  saveAssessment: auditedProcedure
    .use(roleMiddleware(evalRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        scores: z.array(
          z.object({
            questionId: z.string(),
            score: z.number().min(1).max(5),
            evidenceNotes: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireTenantId(ctx);
      for (const item of input.scores) {
        const existing = await ctx.scopedDb.feasibilityAssessment.findFirst({
          where: {
            useCaseId: input.useCaseId,
            questionId: item.questionId,
          },
        });
        if (existing) {
          await ctx.scopedDb.feasibilityAssessment.update({
            where: { id: existing.id },
            data: {
              score: item.score,
              evidenceNotes: item.evidenceNotes,
              scoredById: ctx.user.id,
              scoredAt: new Date(),
            },
          });
        } else {
          await ctx.scopedDb.feasibilityAssessment.create({
            data: {
              useCaseId: input.useCaseId,
              questionId: item.questionId,
              score: item.score,
              evidenceNotes: item.evidenceNotes,
              scoredById: ctx.user.id,
              scoredAt: new Date(),
            },
          });
        }
      }

      const tenantId = requireTenantId(ctx);
      const model = await getOrCreateDefaultScoringModel(ctx.db, tenantId);
      const dimensions = await ctx.scopedDb.feasibilityDimension.findMany({
        where: { modelId: model.id },
        include: { questions: { where: { isActive: true } } },
      });
      const assessments = await ctx.scopedDb.feasibilityAssessment.findMany({
        where: { useCaseId: input.useCaseId },
      });
      const byQuestion = new Map(assessments.map((a) => [a.questionId, a]));

      const dimensionSummaries = dimensions.map((dim) => {
        const scores = dim.questions
          .map((q) => byQuestion.get(q.id)?.score ?? 0)
          .filter((s) => s > 0);
        return {
          weight: dim.weight,
          avg: calculateDimensionAverage(scores),
        };
      });

      const composite = calculateCompositeFeasibility(dimensionSummaries);
      const verdict = composite > 0 ? determineVerdict(composite) : null;

      await ctx.scopedDb.useCase.update({
        where: { id: input.useCaseId },
        data: {
          compositeFeasibility: composite,
          compositeVerdict: verdict ?? undefined,
        },
      });

      return { composite, verdict };
    }),

  getGates: protectedProcedure
    .use(roleMiddleware(evalRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      await ensureHardGates(ctx.scopedDb, input.useCaseId, tenantId);

      const gates = await ctx.scopedDb.hardGate.findMany({
        where: { useCaseId: input.useCaseId },
        orderBy: { gateCode: "asc" },
      });

      const failed = gates.filter((g) => g.result === false);
      const incomplete = gates.filter((g) => g.result == null);
      const status =
        failed.length > 0
          ? HardGateStatus.HAS_FAILURES
          : incomplete.length > 0
            ? HardGateStatus.INCOMPLETE
            : HardGateStatus.ALL_PASSED;

      return { gates, status };
    }),

  saveGates: auditedProcedure
    .use(roleMiddleware(evalRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        gates: z.array(
          z.object({
            id: z.string(),
            result: z.boolean(),
            evidenceNotes: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireTenantId(ctx);
      for (const gate of input.gates) {
        await ctx.scopedDb.hardGate.update({
          where: { id: gate.id },
          data: {
            result: gate.result,
            evidenceNotes: gate.evidenceNotes,
            reviewedById: ctx.user.id,
            reviewedAt: new Date(),
          },
        });
      }

      const gates = await ctx.scopedDb.hardGate.findMany({
        where: { useCaseId: input.useCaseId },
      });
      const failed = gates.filter((g) => g.result === false);
      const incomplete = gates.filter((g) => g.result == null);
      const status =
        failed.length > 0
          ? HardGateStatus.HAS_FAILURES
          : incomplete.length > 0
            ? HardGateStatus.INCOMPLETE
            : HardGateStatus.ALL_PASSED;

      await ctx.scopedDb.useCase.update({
        where: { id: input.useCaseId },
        data: { hardGateStatus: status },
      });

      return { status };
    }),

  getCriteria: protectedProcedure
    .use(roleMiddleware(evalRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      return ctx.scopedDb.successCriteria.findMany({
        where: { useCaseId: input.useCaseId },
        orderBy: { metricName: "asc" },
      });
    }),

  saveCriteria: auditedProcedure
    .use(roleMiddleware(evalRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        criteria: z.array(
          z.object({
            id: z.string().optional(),
            metricName: z.string(),
            metricType: z.string().optional(),
            currentBaseline: z.number().optional(),
            target: z.number().optional(),
            stretchGoal: z.number().optional(),
            measurementMethod: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      await ctx.scopedDb.successCriteria.deleteMany({
        where: { useCaseId: input.useCaseId },
      });

      for (const c of input.criteria.slice(0, 8)) {
        await ctx.scopedDb.successCriteria.create({
          data: {
            useCaseId: input.useCaseId,
            tenantId,
            metricName: c.metricName,
            metricType: c.metricType,
            currentBaseline: c.currentBaseline,
            target: c.target,
            stretchGoal: c.stretchGoal,
            measurementMethod: c.measurementMethod,
          },
        });
      }

      return ctx.scopedDb.successCriteria.findMany({
        where: { useCaseId: input.useCaseId },
      });
    }),

  getScorecard: protectedProcedure
    .use(roleMiddleware(evalRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          financialModel: true,
          effortEstimate: true,
          mandatoryControls: true,
          hardGates: true,
        },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        useCase,
        feasibility: {
          composite: useCase.compositeFeasibility,
          verdict: useCase.compositeVerdict,
        },
        gates: {
          status: useCase.hardGateStatus,
          count: useCase.hardGates.length,
          failed: useCase.hardGates.filter((g) => g.result === false).length,
        },
        financial: useCase.financialModel,
        portfolio: {
          valueScore: useCase.valueScore,
          feasibilityScore: useCase.feasibilityScore,
          riskScore: useCase.riskScore,
          priorityScore: useCase.priorityScore,
          rank: useCase.rank,
        },
        effort: useCase.effortEstimate,
        controls: {
          total: useCase.mandatoryControls.length,
          verified: useCase.mandatoryControls.filter(
            (c) => c.status === "VERIFIED",
          ).length,
        },
      };
    }),

  recordDecision: auditedProcedure
    .use(roleMiddleware(evalRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        decision: z.enum(["APPROVE", "CONDITIONAL", "HOLD", "NO_GO"]),
        reason: z.string().min(10),
        waiverNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.decision === "APPROVE" || input.decision === "CONDITIONAL") {
        if ((useCase.compositeFeasibility ?? 0) < 3.0 && input.decision === "APPROVE") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Composite feasibility must be ≥ 3.0 for approval",
          });
        }
        if (useCase.hardGateStatus === HardGateStatus.HAS_FAILURES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Hard gates must pass (or use Conditional Go with waiver)",
          });
        }

        await ensureStage({
          scopedDb: ctx.scopedDb,
          useCaseId: input.useCaseId,
          tenantId,
          userId: ctx.user.id,
          currentStage: useCase.currentStage,
          targetStage: LifecycleStage.WAVE_PLANNING,
          portfolioScored: true,
          notes: `${input.decision}: ${input.reason}${input.waiverNotes ? ` | Waiver: ${input.waiverNotes}` : ""}`,
        });

        if (input.decision === "CONDITIONAL") {
          await ctx.scopedDb.useCase.update({
            where: { id: input.useCaseId },
            data: { compositeVerdict: CompositeVerdict.CONDITIONAL_GO },
          });
        }
      } else if (input.decision === "HOLD") {
        await ensureStage({
          scopedDb: ctx.scopedDb,
          useCaseId: input.useCaseId,
          tenantId,
          userId: ctx.user.id,
          currentStage: useCase.currentStage,
          targetStage: LifecycleStage.ON_HOLD,
          notes: input.reason,
        });
      } else {
        await ensureStage({
          scopedDb: ctx.scopedDb,
          useCaseId: input.useCaseId,
          tenantId,
          userId: ctx.user.id,
          currentStage: useCase.currentStage,
          targetStage: LifecycleStage.GATED_OUT,
          notes: input.reason,
        });
      }

      return ctx.scopedDb.useCase.findFirst({ where: { id: input.useCaseId } });
    }),
});
