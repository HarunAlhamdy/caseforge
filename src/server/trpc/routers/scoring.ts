import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  LifecycleStage,
  ProfileReviewStatus,
  SecurityRole,
  UseCaseStatus,
  type Prisma,
} from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { auditedProcedure, protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import {
  calculateAxisScore,
  calculateDataReadiness,
  calculatePriorityScore,
  calculateRanking,
  determineRiskTier,
} from "@/lib/scoring/portfolio-scoring";
import { buildAllDriverEvidence } from "@/lib/scoring/evidence-prefill";
import {
  getOrCreateDefaultScoringModel,
  snapshotsFromModel,
  versionToWeightSnapshot,
} from "@/server/services/scoring-model-service";
import { ensureStage } from "@/server/services/lifecycle-service";
import * as XLSX from "xlsx";

const scoringRoles: SecurityRole[] = [
  SecurityRole.PORTFOLIO_MANAGER,
  SecurityRole.EVALUATOR,
  SecurityRole.CUSTOMER_ADMIN,
  SecurityRole.PLATFORM_SUPER_ADMIN,
  SecurityRole.PARTNER_ADMIN,
  SecurityRole.PARTNER_CONSULTANT,
];

function requireTenantId(ctx: {
  access: NonNullable<
    Awaited<ReturnType<typeof import("../context").createContext>>["access"]
  >;
}) {
  if (!ctx.access.tenantId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Select a tenant context for scoring operations",
    });
  }
  return ctx.access.tenantId;
}

function scoreUseCaseFromDrivers(
  driverScores: Record<string, number>,
  weights: ReturnType<typeof versionToWeightSnapshot>,
) {
  const valueScore = calculateAxisScore(
    weights.valueDrivers.map((d) => ({
      weight: d.weight,
      score: driverScores[d.driverId] ?? 0,
    })),
  );
  const feasibilityScore = calculateAxisScore(
    weights.feasibilityDrivers.map((d) => ({
      weight: d.weight,
      score: driverScores[d.driverId] ?? 0,
    })),
  );
  const riskScore = calculateAxisScore(
    weights.riskDrivers.map((d) => ({
      weight: d.weight,
      score: driverScores[d.driverId] ?? 0,
    })),
  );
  const tier = determineRiskTier(riskScore, weights.riskTierConfig);
  const priority = calculatePriorityScore(
    valueScore,
    feasibilityScore,
    weights.valueWeightInPriority,
    weights.feasibilityWeightInPriority,
    tier.multiplier,
  );
  return {
    valueScore,
    feasibilityScore,
    riskScore,
    riskTier: tier.tierCode,
    tierMultiplier: tier.multiplier,
    priorityScore: priority,
  };
}

async function rerankActiveUseCases(
  scopedDb: Prisma.TransactionClient,
  tenantId: string,
) {
  const active = await scopedDb.useCase.findMany({
    where: { tenantId, status: UseCaseStatus.ACTIVE },
    select: { id: true, priorityScore: true },
  });
  const ranked = calculateRanking(
    active
      .filter((u) => u.priorityScore != null)
      .map((u) => ({ id: u.id, priorityScore: u.priorityScore! })),
  );
  for (const uc of active) {
    const rank = ranked.get(uc.id);
    if (rank != null) {
      await scopedDb.useCase.update({
        where: { id: uc.id },
        data: { rank },
      });
    }
  }
}

export const scoringRouter = createTRPCRouter({
  getForUseCase: protectedProcedure
    .use(roleMiddleware(scoringRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          scores: { include: { driver: true } },
          sourceSystemInventory: true,
          sensitiveDataElements: true,
          profileReviews: true,
          currentScoringVersion: true,
        },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const model = await getOrCreateDefaultScoringModel(ctx.db, tenantId);
      const snapshots = snapshotsFromModel(model);
      const activeVersion = model.versions[0];

      const profileNotes: Record<string, string> = {};
      for (const review of useCase.profileReviews) {
        if (review.reviewNotes) profileNotes[review.section] = review.reviewNotes;
      }

      const allDrivers = [
        ...snapshots.valueDrivers,
        ...snapshots.feasibilityDrivers,
        ...snapshots.riskDrivers,
      ];
      const evidencePrefills = buildAllDriverEvidence(
        allDrivers.map((d) => d.driverName),
        useCase as unknown as Record<string, unknown>,
        profileNotes,
      );

      const driverScores: Record<
        string,
        { score: number; evidenceNotes: string | null }
      > = {};
      for (const s of useCase.scores) {
        driverScores[s.driverId] = {
          score: s.score,
          evidenceNotes: s.evidenceNotes,
        };
      }

      const weights = activeVersion
        ? versionToWeightSnapshot(activeVersion)
        : {
            ...snapshots,
            riskTierConfig: snapshots.riskTierConfig,
          };

      const currentDriverScores: Record<string, number> = {};
      for (const [id, val] of Object.entries(driverScores)) {
        currentDriverScores[id] = val.score;
      }

      const computed =
        Object.keys(currentDriverScores).length > 0
          ? scoreUseCaseFromDrivers(currentDriverScores, weights)
          : null;

      const dataReadiness = calculateDataReadiness(
        useCase.sourceSystemInventory.map((s) => ({
          systemName: s.systemName,
          accessMethod: s.accessMethod,
          networkAccess: s.networkAccess,
        })),
        {
          hasKnownIssues: Boolean(useCase.dqIssues),
          remediationNeeded: Boolean(useCase.remediationNeeded),
          dqIssues: useCase.dqIssues,
        },
        useCase.sensitiveDataElements.map((e) => ({
          dataClassification: e.dataClassification,
          piiType: e.piiType,
          entersLlmContext: e.entersLlmContext,
        })),
      );

      return {
        useCase,
        model: { id: model.id, name: model.name },
        activeVersion,
        weights: snapshots,
        drivers: {
          value: snapshots.valueDrivers,
          feasibility: snapshots.feasibilityDrivers,
          risk: snapshots.riskDrivers,
        },
        driverScores,
        evidencePrefills,
        computed,
        dataReadiness,
        versionLabel: activeVersion
          ? `v${activeVersion.versionNumber}`
          : "v1",
      };
    }),

  saveDriverScores: auditedProcedure
    .use(roleMiddleware(scoringRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        scores: z.array(
          z.object({
            driverId: z.string(),
            score: z.number().min(1).max(5),
            evidenceNotes: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const model = await getOrCreateDefaultScoringModel(ctx.db, tenantId);
      const activeVersion = model.versions[0];
      const versionId = activeVersion?.id ?? null;

      for (const item of input.scores) {
        const existing = await ctx.scopedDb.axisScore.findFirst({
          where: { useCaseId: input.useCaseId, driverId: item.driverId },
        });
        if (existing) {
          await ctx.scopedDb.axisScore.update({
            where: { id: existing.id },
            data: {
              score: item.score,
              evidenceNotes: item.evidenceNotes,
              scoredById: ctx.user.id,
              scoredAt: new Date(),
              versionId,
            },
          });
        } else {
          await ctx.scopedDb.axisScore.create({
            data: {
              useCaseId: input.useCaseId,
              driverId: item.driverId,
              score: item.score,
              evidenceNotes: item.evidenceNotes,
              scoredById: ctx.user.id,
              scoredAt: new Date(),
              versionId,
            },
          });
        }
      }

      const allScores = await ctx.scopedDb.axisScore.findMany({
        where: { useCaseId: input.useCaseId },
      });
      const driverScores: Record<string, number> = {};
      for (const s of allScores) driverScores[s.driverId] = s.score;

      const snapshots = snapshotsFromModel(model);
      const weights = activeVersion
        ? {
            ...versionToWeightSnapshot(activeVersion),
            valueDrivers: snapshots.valueDrivers,
            feasibilityDrivers: snapshots.feasibilityDrivers,
            riskDrivers: snapshots.riskDrivers,
          }
        : {
            ...snapshots,
            riskTierConfig: snapshots.riskTierConfig,
          };

      const computed = scoreUseCaseFromDrivers(driverScores, weights);

      const dataReadiness = calculateDataReadiness(
        (
          await ctx.scopedDb.sourceSystem.findMany({
            where: { useCaseId: input.useCaseId },
          })
        ).map((s) => ({
          systemName: s.systemName,
          accessMethod: s.accessMethod,
          networkAccess: s.networkAccess,
        })),
        {
          hasKnownIssues: Boolean(useCase.dqIssues),
          remediationNeeded: Boolean(useCase.remediationNeeded),
        },
        (
          await ctx.scopedDb.sensitiveDataElement.findMany({
            where: { useCaseId: input.useCaseId },
          })
        ).map((e) => ({
          dataClassification: e.dataClassification,
          piiType: e.piiType,
          entersLlmContext: e.entersLlmContext,
        })),
      );

      await ctx.scopedDb.useCase.update({
        where: { id: input.useCaseId },
        data: {
          ...computed,
          riskTier: computed.riskTier as never,
          currentScoringVersionId: versionId,
          dataReadinessFlag: dataReadiness,
        },
      });

      await rerankActiveUseCases(ctx.scopedDb, tenantId);

      return { computed };
    }),

  completeScoring: auditedProcedure
    .use(roleMiddleware(scoringRoles))
    .input(z.object({ useCaseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: { scores: true },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const model = await getOrCreateDefaultScoringModel(ctx.db, tenantId);
      const expectedDriverCount = model.axes.reduce(
        (sum, a) => sum + a.drivers.length,
        0,
      );

      if (useCase.scores.length < expectedDriverCount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `All ${expectedDriverCount} drivers must be scored before completing`,
        });
      }

      const incomplete = useCase.scores.some((s) => s.score < 1 || s.score > 5);
      if (incomplete) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All driver scores must be between 1 and 5",
        });
      }

      const reviewsComplete = await ctx.scopedDb.profileReview.count({
        where: {
          useCaseId: input.useCaseId,
          status: { not: ProfileReviewStatus.APPROVED },
        },
      });

      await ensureStage({
        scopedDb: ctx.scopedDb,
        useCaseId: input.useCaseId,
        tenantId,
        userId: ctx.user.id,
        currentStage: useCase.currentStage,
        targetStage: LifecycleStage.DEEP_FEASIBILITY,
        portfolioScored: true,
        profileReviewsComplete: reviewsComplete === 0,
        notes: "Portfolio scoring complete",
      });

      return ctx.scopedDb.useCase.findFirst({ where: { id: input.useCaseId } });
    }),

  getPortfolio: protectedProcedure
    .use(roleMiddleware(scoringRoles))
    .input(
      z
        .object({
          versionId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const model = await getOrCreateDefaultScoringModel(ctx.db, tenantId);

      if (input?.versionId) {
        const snapshots = await ctx.scopedDb.scoringSnapshot.findMany({
          where: { versionId: input.versionId, tenantId },
          include: {
            useCase: {
              select: {
                id: true,
                useCaseNumber: true,
                title: true,
                businessUnit: true,
                wave: true,
                costBand: true,
                dataReadinessFlag: true,
              },
            },
          },
          orderBy: { rank: "asc" },
        });
        return {
          mode: "snapshot" as const,
          versionId: input.versionId,
          items: snapshots.map((s) => ({
            useCaseId: s.useCaseId,
            useCaseNumber: s.useCase.useCaseNumber,
            title: s.useCase.title,
            businessUnit: s.useCase.businessUnit,
            valueScore: s.valueScore,
            feasibilityScore: s.feasibilityScore,
            riskScore: s.riskScore,
            riskTier: s.riskTier,
            priorityScore: s.priorityScore,
            rank: s.rank,
            wave: s.useCase.wave,
            costBand: s.useCase.costBand,
            dataReadinessFlag: s.useCase.dataReadinessFlag,
          })),
        };
      }

      const useCases = await ctx.scopedDb.useCase.findMany({
        where: { tenantId, status: UseCaseStatus.ACTIVE },
        orderBy: [{ rank: "asc" }, { priorityScore: "desc" }],
      });

      return {
        mode: "current" as const,
        modelId: model.id,
        items: useCases.map((uc) => ({
          useCaseId: uc.id,
          useCaseNumber: uc.useCaseNumber,
          title: uc.title,
          businessUnit: uc.businessUnit,
          valueScore: uc.valueScore,
          feasibilityScore: uc.feasibilityScore,
          riskScore: uc.riskScore,
          riskTier: uc.riskTier,
          priorityScore: uc.priorityScore,
          rank: uc.rank,
          wave: uc.wave,
          costBand: uc.costBand,
          dataReadinessFlag: uc.dataReadinessFlag,
        })),
      };
    }),

  listVersions: protectedProcedure
    .use(roleMiddleware(scoringRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantId(ctx);
      const model = await getOrCreateDefaultScoringModel(ctx.db, tenantId);
      return ctx.scopedDb.scoringModelVersion.findMany({
        where: { modelId: model.id, tenantId },
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          effectiveDate: true,
          changeSummary: true,
        },
      });
    }),

  compareVersionRankings: protectedProcedure
    .use(roleMiddleware(scoringRoles))
    .input(
      z.object({
        versionIdA: z.string(),
        versionIdB: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const [snapshotsA, snapshotsB] = await Promise.all([
        ctx.scopedDb.scoringSnapshot.findMany({
          where: { versionId: input.versionIdA, tenantId },
          include: {
            useCase: { select: { useCaseNumber: true, title: true } },
          },
        }),
        ctx.scopedDb.scoringSnapshot.findMany({
          where: { versionId: input.versionIdB, tenantId },
        }),
      ]);

      const bByUseCase = new Map(snapshotsB.map((s) => [s.useCaseId, s]));

      return snapshotsA.map((a) => {
        const b = bByUseCase.get(a.useCaseId);
        return {
          useCaseId: a.useCaseId,
          useCaseNumber: a.useCase.useCaseNumber,
          title: a.useCase.title,
          rankA: a.rank,
          rankB: b?.rank ?? null,
          priorityA: a.priorityScore,
          priorityB: b?.priorityScore ?? null,
          rankDelta: b ? a.rank - b.rank : null,
        };
      });
    }),

  getScoreHistory: protectedProcedure
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      return ctx.scopedDb.scoringSnapshot.findMany({
        where: { useCaseId: input.useCaseId },
        include: {
          version: {
            select: {
              versionNumber: true,
              effectiveDate: true,
            },
          },
        },
        orderBy: { snapshotDate: "asc" },
      });
    }),

  exportPortfolioExcel: protectedProcedure
    .use(roleMiddleware(scoringRoles))
    .input(z.object({ versionId: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);

      let rows: Array<Record<string, unknown>> = [];

      if (input?.versionId) {
        const snapshots = await ctx.scopedDb.scoringSnapshot.findMany({
          where: { versionId: input.versionId, tenantId },
          include: { useCase: true },
          orderBy: { rank: "asc" },
        });
        rows = snapshots.map((s) => ({
          Rank: s.rank,
          "Use Case #": s.useCase.useCaseNumber,
          Title: s.useCase.title,
          Directorate: s.useCase.businessUnit,
          Value: s.valueScore,
          Feasibility: s.feasibilityScore,
          Risk: s.riskScore,
          Tier: s.riskTier,
          Priority: s.priorityScore,
          Wave: s.useCase.wave ?? "",
          Readiness: s.useCase.dataReadinessFlag ?? "",
        }));
      } else {
        const useCases = await ctx.scopedDb.useCase.findMany({
          where: { tenantId, status: UseCaseStatus.ACTIVE },
          orderBy: { rank: "asc" },
        });
        rows = useCases.map((uc) => ({
          Rank: uc.rank,
          "Use Case #": uc.useCaseNumber,
          Title: uc.title,
          Directorate: uc.businessUnit,
          Value: uc.valueScore,
          Feasibility: uc.feasibilityScore,
          Risk: uc.riskScore,
          Tier: uc.riskTier,
          Priority: uc.priorityScore,
          Wave: uc.wave ?? "",
          Readiness: uc.dataReadinessFlag ?? "",
        }));
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Portfolio");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return {
        fileName: `portfolio-${new Date().toISOString().slice(0, 10)}.xlsx`,
        base64: Buffer.from(buffer).toString("base64"),
      };
    }),
});
