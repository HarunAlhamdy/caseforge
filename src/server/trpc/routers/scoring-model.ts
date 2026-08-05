import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  ScoringModelVersionStatus,
  SecurityRole,
  UseCaseStatus,
  WeightProposalStatus,
  type Prisma,
} from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { auditedProcedure, protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import {
  createVersionSnapshot,
  hypotheticalRescore,
  summarizeWeightChanges,
} from "@/lib/scoring/weight-versioning";
import {
  determineRiskTier,
  priorityScore,
  rankByPriority,
  weightedAxisScore,
} from "@/lib/scoring/portfolio-scoring";
import {
  getOrCreateDefaultScoringModel,
  snapshotsFromModel,
  versionToWeightSnapshot,
} from "@/server/services/scoring-model-service";
import type { ScoringDriverSnapshot } from "@/lib/types";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

const scoringAdminRoles: SecurityRole[] = [
  SecurityRole.PLATFORM_SUPER_ADMIN,
  SecurityRole.PARTNER_ADMIN,
  SecurityRole.PARTNER_CONSULTANT,
  SecurityRole.CUSTOMER_ADMIN,
  SecurityRole.PORTFOLIO_MANAGER,
];

const scoringApplyRoles: SecurityRole[] = [
  SecurityRole.PLATFORM_SUPER_ADMIN,
  SecurityRole.CUSTOMER_ADMIN,
];

const proposalRoles: SecurityRole[] = [
  SecurityRole.PARTNER_CONSULTANT,
  SecurityRole.PARTNER_ADMIN,
  SecurityRole.PORTFOLIO_MANAGER,
];

const driverSnapshotSchema = z.object({
  driverId: z.string(),
  driverName: z.string(),
  weight: z.number().min(0).max(1),
  axisType: z.enum(["VALUE", "FEASIBILITY", "RISK"]),
});

const weightSnapshotSchema = z.object({
  valueDrivers: z.array(driverSnapshotSchema),
  feasibilityDrivers: z.array(driverSnapshotSchema),
  riskDrivers: z.array(driverSnapshotSchema),
  valueWeightInPriority: z.number().min(0).max(1),
  feasibilityWeightInPriority: z.number().min(0).max(1),
});

function requireTenantId(ctx: {
  access: NonNullable<
    Awaited<
      ReturnType<typeof import("../context").createContext>
    >["access"]
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

function assertAxisWeightsSum(drivers: ScoringDriverSnapshot[], axis: string) {
  const sum = drivers.reduce((total, d) => total + d.weight, 0);
  if (Math.abs(sum - 1) > 0.02) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${axis} driver weights must sum to ~1.00 (got ${sum.toFixed(3)})`,
    });
  }
}

async function loadActiveCasesWithScores(
  ctx: { scopedDb: NonNullable<Awaited<ReturnType<typeof import("../context").createContext>>["scopedDb"]> },
  tenantId: string,
) {
  const useCases = await ctx.scopedDb.useCase.findMany({
    where: { tenantId, status: UseCaseStatus.ACTIVE },
    include: {
      scores: true,
    },
    orderBy: { useCaseNumber: "asc" },
  });

  return useCases.map((uc) => {
    const driverScores: Record<string, number> = {};
    for (const score of uc.scores) {
      driverScores[score.driverId] = score.score;
    }
    return {
      id: uc.id,
      useCaseNumber: uc.useCaseNumber,
      title: uc.title,
      driverScores,
      priorityScore: uc.priorityScore,
      rank: uc.rank,
      valueScore: uc.valueScore,
      feasibilityScore: uc.feasibilityScore,
      riskScore: uc.riskScore,
      riskTier: uc.riskTier,
      tierMultiplier: uc.tierMultiplier,
    };
  });
}

function scoreCaseFromDrivers(
  driverScores: Record<string, number>,
  weights: ReturnType<typeof createVersionSnapshot>,
) {
  const valueScore = weightedAxisScore(
    weights.valueDrivers.map((d) => ({
      weight: d.weight,
      score: driverScores[d.driverId] ?? 3,
    })),
  );
  const feasibilityScore = weightedAxisScore(
    weights.feasibilityDrivers.map((d) => ({
      weight: d.weight,
      score: driverScores[d.driverId] ?? 3,
    })),
  );
  const riskScore = weightedAxisScore(
    weights.riskDrivers.map((d) => ({
      weight: d.weight,
      score: driverScores[d.driverId] ?? 3,
    })),
  );
  const tier = determineRiskTier(riskScore, weights.riskTierConfig);
  const computedPriority = priorityScore(
    valueScore,
    feasibilityScore,
    tier.multiplier,
    weights.valueWeightInPriority,
    weights.feasibilityWeightInPriority,
  );

  return {
    valueScore,
    feasibilityScore,
    riskScore,
    riskTier: tier.tierCode,
    tierMultiplier: tier.multiplier,
    priorityScore: computedPriority,
  };
}

export const scoringModelRouter = createTRPCRouter({
  getModel: protectedProcedure
    .use(roleMiddleware(scoringAdminRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantId(ctx);
      const model = await getOrCreateDefaultScoringModel(
        ctx.db,
        tenantId,
        ctx.user.id,
      );

      const activeVersion = model.versions[0] ?? null;
      const pendingProposal = await ctx.scopedDb.weightChangeProposal.findFirst({
        where: {
          modelId: model.id,
          status: WeightProposalStatus.PROPOSED,
        },
        include: {
          proposedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { proposedAt: "desc" },
      });

      return {
        model: {
          id: model.id,
          name: model.name,
          ...snapshotsFromModel(model),
        },
        activeVersion,
        pendingProposal,
      };
    }),

  createDraftVersion: auditedProcedure
    .use(roleMiddleware(scoringAdminRoles))
    .input(
      z.object({
        modelId: z.string(),
        weights: weightSnapshotSchema,
        changeReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const normalized = createVersionSnapshot({
        ...input.weights,
        riskTierConfig: [],
      });

      assertAxisWeightsSum(normalized.valueDrivers, "Value");
      assertAxisWeightsSum(normalized.feasibilityDrivers, "Feasibility");
      assertAxisWeightsSum(normalized.riskDrivers, "Risk");

      const model = await ctx.scopedDb.scoringModel.findFirst({
        where: { id: input.modelId, tenantId },
        include: { riskTiers: { orderBy: { displayOrder: "asc" } } },
      });
      if (!model) throw new TRPCError({ code: "NOT_FOUND" });

      normalized.riskTierConfig = model.riskTiers.map((t) => ({
        tierCode: t.tierCode,
        tierName: t.tierName,
        upperBound: t.upperBound,
        multiplier: t.multiplier,
        controlsInherited: t.controlsInherited ?? undefined,
      }));

      const latest = await ctx.scopedDb.scoringModelVersion.findFirst({
        where: { modelId: model.id },
        orderBy: { versionNumber: "desc" },
      });

      const activeVersion = await ctx.scopedDb.scoringModelVersion.findFirst({
        where: {
          modelId: model.id,
          status: ScoringModelVersionStatus.ACTIVE,
        },
      });

      const changeSummary = activeVersion
        ? summarizeWeightChanges(
            versionToWeightSnapshot(activeVersion),
            normalized,
          )
        : "Draft version created";

      return ctx.scopedDb.scoringModelVersion.create({
        data: {
          modelId: model.id,
          tenantId,
          versionNumber: (latest?.versionNumber ?? 0) + 1,
          status: ScoringModelVersionStatus.DRAFT,
          valueDriversJson: asJson(normalized.valueDrivers),
          feasibilityDriversJson: asJson(normalized.feasibilityDrivers),
          riskDriversJson: asJson(normalized.riskDrivers),
          valueWeightInPriority: normalized.valueWeightInPriority,
          feasibilityWeightInPriority: normalized.feasibilityWeightInPriority,
          riskTierConfigJson: asJson(normalized.riskTierConfig),
          changeSummary,
          changeReason: input.changeReason,
          createdById: ctx.user.id,
        },
      });
    }),

  previewImpact: protectedProcedure
    .use(roleMiddleware(scoringAdminRoles))
    .input(
      z.object({
        weights: weightSnapshotSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const model = await getOrCreateDefaultScoringModel(ctx.db, tenantId);

      const normalized = createVersionSnapshot({
        ...input.weights,
        riskTierConfig: model.riskTiers.map((t) => ({
          tierCode: t.tierCode,
          tierName: t.tierName,
          upperBound: t.upperBound,
          multiplier: t.multiplier,
          controlsInherited: t.controlsInherited ?? undefined,
        })),
      });

      const cases = await loadActiveCasesWithScores(ctx, tenantId);
      return hypotheticalRescore(cases, normalized);
    }),

  applyVersion: auditedProcedure
    .use(roleMiddleware(scoringApplyRoles))
    .input(
      z.object({
        modelId: z.string(),
        weights: weightSnapshotSchema,
        changeReason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const model = await ctx.scopedDb.scoringModel.findFirst({
        where: { id: input.modelId, tenantId },
        include: { riskTiers: { orderBy: { displayOrder: "asc" } } },
      });
      if (!model) throw new TRPCError({ code: "NOT_FOUND" });

      const normalized = createVersionSnapshot({
        ...input.weights,
        riskTierConfig: model.riskTiers.map((t) => ({
          tierCode: t.tierCode,
          tierName: t.tierName,
          upperBound: t.upperBound,
          multiplier: t.multiplier,
          controlsInherited: t.controlsInherited ?? undefined,
        })),
      });

      assertAxisWeightsSum(normalized.valueDrivers, "Value");
      assertAxisWeightsSum(normalized.feasibilityDrivers, "Feasibility");
      assertAxisWeightsSum(normalized.riskDrivers, "Risk");

      const activeVersion = await ctx.scopedDb.scoringModelVersion.findFirst({
        where: {
          modelId: model.id,
          status: ScoringModelVersionStatus.ACTIVE,
        },
      });

      const changeSummary = activeVersion
        ? summarizeWeightChanges(
            versionToWeightSnapshot(activeVersion),
            normalized,
          )
        : "Initial active version";

      const latest = await ctx.scopedDb.scoringModelVersion.findFirst({
        where: { modelId: model.id },
        orderBy: { versionNumber: "desc" },
      });

      const cases = await loadActiveCasesWithScores(ctx, tenantId);

      return ctx.db.$transaction(async (tx) => {
        if (activeVersion) {
          await tx.scoringModelVersion.update({
            where: { id: activeVersion.id },
            data: {
              status: ScoringModelVersionStatus.SUPERSEDED,
              supersededDate: new Date(),
            },
          });

          for (const uc of cases) {
            if (
              uc.valueScore != null &&
              uc.feasibilityScore != null &&
              uc.riskScore != null &&
              uc.riskTier &&
              uc.tierMultiplier != null &&
              uc.priorityScore != null &&
              uc.rank != null
            ) {
              await tx.scoringSnapshot.create({
                data: {
                  useCaseId: uc.id,
                  tenantId,
                  versionId: activeVersion.id,
                  valueScore: uc.valueScore,
                  feasibilityScore: uc.feasibilityScore,
                  riskScore: uc.riskScore,
                  riskTier: uc.riskTier,
                  tierMultiplier: uc.tierMultiplier,
                  priorityScore: uc.priorityScore,
                  rank: uc.rank,
                },
              });
            }
          }
        }

        const newVersion = await tx.scoringModelVersion.create({
          data: {
            modelId: model.id,
            tenantId,
            versionNumber: (latest?.versionNumber ?? 0) + 1,
            status: ScoringModelVersionStatus.ACTIVE,
            effectiveDate: new Date(),
            valueDriversJson: asJson(normalized.valueDrivers),
            feasibilityDriversJson: asJson(normalized.feasibilityDrivers),
            riskDriversJson: asJson(normalized.riskDrivers),
            valueWeightInPriority: normalized.valueWeightInPriority,
            feasibilityWeightInPriority: normalized.feasibilityWeightInPriority,
            riskTierConfigJson: asJson(normalized.riskTierConfig),
            changeSummary,
            changeReason: input.changeReason,
            createdById: ctx.user.id,
          },
        });

        await tx.scoringModel.update({
          where: { id: model.id },
          data: {
            valueWeightInPriority: normalized.valueWeightInPriority,
            feasibilityWeightInPriority: normalized.feasibilityWeightInPriority,
          },
        });

        for (const driver of [
          ...normalized.valueDrivers,
          ...normalized.feasibilityDrivers,
          ...normalized.riskDrivers,
        ]) {
          await tx.scoringDriver.updateMany({
            where: { id: driver.driverId },
            data: { weight: driver.weight },
          });
        }

        const rescored = cases.map((uc) => ({
          ...uc,
          ...scoreCaseFromDrivers(uc.driverScores, normalized),
        }));

        const ranked = rankByPriority(
          rescored.map((r) => ({ id: r.id, priorityScore: r.priorityScore })),
        );
        const rankById = new Map(ranked.map((r) => [r.id, r.rank]));

        for (const item of rescored) {
          await tx.useCase.update({
            where: { id: item.id },
            data: {
              valueScore: item.valueScore,
              feasibilityScore: item.feasibilityScore,
              riskScore: item.riskScore,
              riskTier: item.riskTier as never,
              tierMultiplier: item.tierMultiplier,
              priorityScore: item.priorityScore,
              rank: rankById.get(item.id),
              currentScoringVersionId: newVersion.id,
            },
          });
        }

        const notifyUsers = await tx.user.findMany({
          where: {
            tenantId,
            role: {
              in: [
                SecurityRole.PORTFOLIO_MANAGER,
                SecurityRole.CUSTOMER_ADMIN,
              ],
            },
            isActive: true,
          },
          select: { id: true },
        });

        for (const user of notifyUsers) {
          await tx.notification.create({
            data: {
              tenantId,
              userId: user.id,
              title: "Scoring weights updated",
              message: `${changeSummary}. Active use cases were re-scored under version v${newVersion.versionNumber}.`,
              link: "/admin/customer",
            },
          });
        }

        if (ctx.access!.partnerId) {
          const partnerAdmins = await tx.user.findMany({
            where: {
              partnerUser: { partnerId: ctx.access!.partnerId! },
              role: SecurityRole.PARTNER_ADMIN,
              isActive: true,
            },
            select: { id: true },
          });
          for (const admin of partnerAdmins) {
            await tx.notification.create({
              data: {
                tenantId,
                userId: admin.id,
                title: "Customer scoring weights updated",
                message: changeSummary,
                link: "/admin/customer",
              },
            });
          }
        }

        return newVersion;
      });
    }),

  listVersions: protectedProcedure
    .use(roleMiddleware(scoringAdminRoles))
    .input(z.object({ modelId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      return ctx.scopedDb.scoringModelVersion.findMany({
        where: { modelId: input.modelId, tenantId },
        orderBy: { versionNumber: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { snapshots: true } },
        },
      });
    }),

  getVersionSnapshots: protectedProcedure
    .use(roleMiddleware(scoringAdminRoles))
    .input(z.object({ versionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      return ctx.scopedDb.scoringSnapshot.findMany({
        where: { versionId: input.versionId, tenantId },
        include: {
          useCase: {
            select: { id: true, useCaseNumber: true, title: true },
          },
        },
        orderBy: { rank: "asc" },
      });
    }),

  compareVersions: protectedProcedure
    .use(roleMiddleware(scoringAdminRoles))
    .input(
      z.object({
        versionIdA: z.string(),
        versionIdB: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const [snapshotsA, snapshotsB, versionA, versionB] = await Promise.all([
        ctx.scopedDb.scoringSnapshot.findMany({
          where: { versionId: input.versionIdA, tenantId },
          include: {
            useCase: {
              select: { useCaseNumber: true, title: true },
            },
          },
        }),
        ctx.scopedDb.scoringSnapshot.findMany({
          where: { versionId: input.versionIdB, tenantId },
        }),
        ctx.scopedDb.scoringModelVersion.findFirst({
          where: { id: input.versionIdA, tenantId },
        }),
        ctx.scopedDb.scoringModelVersion.findFirst({
          where: { id: input.versionIdB, tenantId },
        }),
      ]);

      const rankBByUseCase = new Map(
        snapshotsB.map((s) => [s.useCaseId, s]),
      );

      return {
        versionA,
        versionB,
        comparisons: snapshotsA.map((a) => {
          const b = rankBByUseCase.get(a.useCaseId);
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
        }),
      };
    }),

  createProposal: auditedProcedure
    .use(roleMiddleware(proposalRoles))
    .input(
      z.object({
        modelId: z.string(),
        weights: weightSnapshotSchema,
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const normalized = createVersionSnapshot({
        ...input.weights,
        riskTierConfig: [],
      });

      const cases = await loadActiveCasesWithScores(ctx, tenantId);
      const model = await ctx.scopedDb.scoringModel.findFirst({
        where: { id: input.modelId, tenantId },
        include: { riskTiers: { orderBy: { displayOrder: "asc" } } },
      });
      if (!model) throw new TRPCError({ code: "NOT_FOUND" });

      normalized.riskTierConfig = model.riskTiers.map((t) => ({
        tierCode: t.tierCode,
        tierName: t.tierName,
        upperBound: t.upperBound,
        multiplier: t.multiplier,
        controlsInherited: t.controlsInherited ?? undefined,
      }));

      const impactPreview = hypotheticalRescore(cases, normalized);

      const proposal = await ctx.scopedDb.weightChangeProposal.create({
        data: {
          modelId: input.modelId,
          tenantId,
          proposedById: ctx.user.id,
          reason: input.reason,
          proposedValueDriversJson: asJson(normalized.valueDrivers),
          proposedFeasibilityDriversJson: asJson(normalized.feasibilityDrivers),
          proposedRiskDriversJson: asJson(normalized.riskDrivers),
          proposedValueWeight: normalized.valueWeightInPriority,
          proposedFeasibilityWeight: normalized.feasibilityWeightInPriority,
          impactPreviewJson: asJson(impactPreview),
        },
      });

      const admins = await ctx.scopedDb.user.findMany({
        where: { tenantId, role: SecurityRole.CUSTOMER_ADMIN, isActive: true },
        select: { id: true },
      });

      for (const admin of admins) {
        await ctx.db.notification.create({
          data: {
            tenantId,
            userId: admin.id,
            title: "Weight change proposed",
            message: input.reason,
            link: "/admin/customer",
          },
        });
      }

      return proposal;
    }),

  approveProposal: auditedProcedure
    .use(roleMiddleware(scoringApplyRoles))
    .input(
      z.object({
        proposalId: z.string(),
        resolutionNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const proposal = await ctx.scopedDb.weightChangeProposal.findFirst({
        where: {
          id: input.proposalId,
          tenantId,
          status: WeightProposalStatus.PROPOSED,
        },
      });
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.scopedDb.weightChangeProposal.update({
        where: { id: proposal.id },
        data: {
          status: WeightProposalStatus.APPROVED,
          resolvedById: ctx.user.id,
          resolvedAt: new Date(),
          resolutionNotes: input.resolutionNotes,
        },
      });

      const model = await ctx.scopedDb.scoringModel.findFirst({
        where: { id: proposal.modelId, tenantId },
        include: { riskTiers: { orderBy: { displayOrder: "asc" } } },
      });
      if (!model) throw new TRPCError({ code: "NOT_FOUND" });

      const weights = {
        valueDrivers: (proposal.proposedValueDriversJson ??
          []) as unknown as ScoringDriverSnapshot[],
        feasibilityDrivers: (proposal.proposedFeasibilityDriversJson ??
          []) as unknown as ScoringDriverSnapshot[],
        riskDrivers: (proposal.proposedRiskDriversJson ??
          []) as unknown as ScoringDriverSnapshot[],
        valueWeightInPriority: proposal.proposedValueWeight ?? 0.5,
        feasibilityWeightInPriority: proposal.proposedFeasibilityWeight ?? 0.5,
      };

      const normalized = createVersionSnapshot({
        ...weights,
        riskTierConfig: model.riskTiers.map((t) => ({
          tierCode: t.tierCode,
          tierName: t.tierName,
          upperBound: t.upperBound,
          multiplier: t.multiplier,
          controlsInherited: t.controlsInherited ?? undefined,
        })),
      });

      assertAxisWeightsSum(normalized.valueDrivers, "Value");
      assertAxisWeightsSum(normalized.feasibilityDrivers, "Feasibility");
      assertAxisWeightsSum(normalized.riskDrivers, "Risk");

      const activeVersion = await ctx.scopedDb.scoringModelVersion.findFirst({
        where: {
          modelId: model.id,
          status: ScoringModelVersionStatus.ACTIVE,
        },
      });

      const changeSummary = activeVersion
        ? summarizeWeightChanges(
            versionToWeightSnapshot(activeVersion),
            normalized,
          )
        : "Approved proposal";

      const latest = await ctx.scopedDb.scoringModelVersion.findFirst({
        where: { modelId: model.id },
        orderBy: { versionNumber: "desc" },
      });

      const cases = await loadActiveCasesWithScores(ctx, tenantId);

      return ctx.db.$transaction(async (tx) => {
        if (activeVersion) {
          await tx.scoringModelVersion.update({
            where: { id: activeVersion.id },
            data: {
              status: ScoringModelVersionStatus.SUPERSEDED,
              supersededDate: new Date(),
            },
          });

          for (const uc of cases) {
            if (
              uc.valueScore != null &&
              uc.feasibilityScore != null &&
              uc.riskScore != null &&
              uc.riskTier &&
              uc.tierMultiplier != null &&
              uc.priorityScore != null &&
              uc.rank != null
            ) {
              await tx.scoringSnapshot.create({
                data: {
                  useCaseId: uc.id,
                  tenantId,
                  versionId: activeVersion.id,
                  valueScore: uc.valueScore,
                  feasibilityScore: uc.feasibilityScore,
                  riskScore: uc.riskScore,
                  riskTier: uc.riskTier,
                  tierMultiplier: uc.tierMultiplier,
                  priorityScore: uc.priorityScore,
                  rank: uc.rank,
                },
              });
            }
          }
        }

        const newVersion = await tx.scoringModelVersion.create({
          data: {
            modelId: model.id,
            tenantId,
            versionNumber: (latest?.versionNumber ?? 0) + 1,
            status: ScoringModelVersionStatus.ACTIVE,
            effectiveDate: new Date(),
            valueDriversJson: asJson(normalized.valueDrivers),
            feasibilityDriversJson: asJson(normalized.feasibilityDrivers),
            riskDriversJson: asJson(normalized.riskDrivers),
            valueWeightInPriority: normalized.valueWeightInPriority,
            feasibilityWeightInPriority: normalized.feasibilityWeightInPriority,
            riskTierConfigJson: asJson(normalized.riskTierConfig),
            changeSummary,
            changeReason: proposal.reason ?? "Approved proposal",
            createdById: ctx.user.id,
          },
        });

        await tx.scoringModel.update({
          where: { id: model.id },
          data: {
            valueWeightInPriority: normalized.valueWeightInPriority,
            feasibilityWeightInPriority: normalized.feasibilityWeightInPriority,
          },
        });

        for (const driver of [
          ...normalized.valueDrivers,
          ...normalized.feasibilityDrivers,
          ...normalized.riskDrivers,
        ]) {
          await tx.scoringDriver.updateMany({
            where: { id: driver.driverId },
            data: { weight: driver.weight },
          });
        }

        const rescored = cases.map((uc) => ({
          ...uc,
          ...scoreCaseFromDrivers(uc.driverScores, normalized),
        }));

        const ranked = rankByPriority(
          rescored.map((r) => ({ id: r.id, priorityScore: r.priorityScore })),
        );
        const rankById = new Map(ranked.map((r) => [r.id, r.rank]));

        for (const item of rescored) {
          await tx.useCase.update({
            where: { id: item.id },
            data: {
              valueScore: item.valueScore,
              feasibilityScore: item.feasibilityScore,
              riskScore: item.riskScore,
              riskTier: item.riskTier as never,
              tierMultiplier: item.tierMultiplier,
              priorityScore: item.priorityScore,
              rank: rankById.get(item.id),
              currentScoringVersionId: newVersion.id,
            },
          });
        }

        return newVersion;
      });
    }),

  rejectProposal: auditedProcedure
    .use(roleMiddleware(scoringApplyRoles))
    .input(
      z.object({
        proposalId: z.string(),
        resolutionNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const proposal = await ctx.scopedDb.weightChangeProposal.findFirst({
        where: {
          id: input.proposalId,
          tenantId,
          status: WeightProposalStatus.PROPOSED,
        },
      });
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.scopedDb.weightChangeProposal.update({
        where: { id: proposal.id },
        data: {
          status: WeightProposalStatus.REJECTED,
          resolvedById: ctx.user.id,
          resolvedAt: new Date(),
          resolutionNotes: input.resolutionNotes,
        },
      });
    }),
});
