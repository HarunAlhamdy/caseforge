import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  AiPattern,
  ControlStatus,
  LifecycleStage,
  SecurityRole,
  type Prisma,
} from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { auditedProcedure, protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import { determineControls } from "@/lib/scoring/control-inheritance";
import { calculateEffort } from "@/lib/scoring/effort-calculator";
import { ensureStage } from "@/server/services/lifecycle-service";
import type { AgentToolSpec } from "@/lib/types";

const architectRoles: SecurityRole[] = [
  SecurityRole.EVALUATOR,
  SecurityRole.CUSTOMER_ADMIN,
  SecurityRole.PLATFORM_SUPER_ADMIN,
  SecurityRole.PORTFOLIO_MANAGER,
];

const architectureInputSchema = z.object({
  useCaseId: z.string(),
  aiPattern: z.nativeEnum(AiPattern).optional(),
  agentSubPattern: z.string().optional().nullable(),
  llmModels: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  modelHosting: z.string().optional().nullable(),
  contextWindowReq: z.number().optional().nullable(),
  tokenEstimatePerTx: z.number().optional().nullable(),
  dailyTxVolume: z.number().optional().nullable(),
  estMonthlyLlmCost: z.number().optional().nullable(),
  fineTuningRequired: z.boolean().optional().nullable(),
  trainingDataDesc: z.string().optional().nullable(),
  ragCorpusDesc: z.string().optional().nullable(),
  ragCorpusDocCount: z.number().optional().nullable(),
  ragUpdateFrequency: z.string().optional().nullable(),
  chunkingStrategy: z.string().optional().nullable(),
  embeddingModel: z.string().optional().nullable(),
  vectorStore: z.string().optional().nullable(),
  retrievalStrategy: z.string().optional().nullable(),
  rerankingEnabled: z.boolean().optional().nullable(),
  citationRequired: z.boolean().optional().nullable(),
  corpusSensitiveData: z.boolean().optional().nullable(),
  agentTools: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  agentWriteActions: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  agentReadActions: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  approvalGates: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  maxToolCalls: z.number().optional().nullable(),
  toolCallTimeoutSec: z.number().optional().nullable(),
  fallbackBehavior: z.string().optional().nullable(),
  memoryMgmt: z.string().optional().nullable(),
  orchestrationPattern: z.string().optional().nullable(),
  observabilityTool: z.string().optional().nullable(),
  inputValidation: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  outputValidation: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  contentFilterLevel: z.string().optional().nullable(),
  promptInjectionMitigation: z.string().optional().nullable(),
  hallucinationMitigation: z.string().optional().nullable(),
  piiLeakagePrevention: z.string().optional().nullable(),
  rateLimitConfig: z.string().optional().nullable(),
  tokenBudgetMax: z.number().optional().nullable(),
  biasTestingScope: z.string().optional().nullable(),
  redTeamScope: z.string().optional().nullable(),
  driftMonitoringPlan: z.string().optional().nullable(),
  computeRequirements: z.string().optional().nullable(),
  storageRequirements: z.string().optional().nullable(),
  estMonthlyInfraCost: z.number().optional().nullable(),
  deploymentArch: z.string().optional().nullable(),
  scalingStrategy: z.string().optional().nullable(),
  haRequirements: z.string().optional().nullable(),
  loggingConfig: z.string().optional().nullable(),
  backupRecovery: z.string().optional().nullable(),
  envPromotionPath: z.string().optional().nullable(),
  status: z.string().optional(),
});

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

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function autoCalcLlmCost(
  tokenEstimate?: number | null,
  dailyVolume?: number | null,
): number | null {
  if (!tokenEstimate || !dailyVolume) return null;
  const monthlyTokens = tokenEstimate * dailyVolume * 30;
  return Math.round(monthlyTokens * 0.000002 * 100) / 100;
}

export const architectureRouter = createTRPCRouter({
  get: protectedProcedure
    .use(roleMiddleware(architectRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          solutionArchitecture: true,
          sensitiveDataElements: true,
          mandatoryControls: true,
          effortEstimate: true,
          sourceSystemInventory: true,
        },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });
      return useCase;
    }),

  save: auditedProcedure
    .use(roleMiddleware(architectRoles))
    .input(architectureInputSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const { useCaseId, ...data } = input;

      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: useCaseId, tenantId },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const llmCost =
        data.estMonthlyLlmCost ??
        autoCalcLlmCost(data.tokenEstimatePerTx, data.dailyTxVolume);

      const payload = {
        ...data,
        aiPattern: data.aiPattern ?? useCase.aiPattern ?? AiPattern.RAG,
        estMonthlyLlmCost: llmCost,
        llmModels: data.llmModels ? asJson(data.llmModels) : undefined,
        agentTools: data.agentTools ? asJson(data.agentTools) : undefined,
        agentWriteActions: data.agentWriteActions
          ? asJson(data.agentWriteActions)
          : undefined,
        agentReadActions: data.agentReadActions
          ? asJson(data.agentReadActions)
          : undefined,
        approvalGates: data.approvalGates ? asJson(data.approvalGates) : undefined,
        inputValidation: data.inputValidation
          ? asJson(data.inputValidation)
          : undefined,
        outputValidation: data.outputValidation
          ? asJson(data.outputValidation)
          : undefined,
      };

      const existing = await ctx.scopedDb.solutionArchitecture.findUnique({
        where: { useCaseId },
      });

      if (existing) {
        return ctx.scopedDb.solutionArchitecture.update({
          where: { useCaseId },
          data: payload as Prisma.SolutionArchitectureUncheckedUpdateInput,
        });
      }

      return ctx.scopedDb.solutionArchitecture.create({
        data: {
          useCaseId,
          tenantId,
          createdById: ctx.user.id,
          ...payload,
          aiPattern: payload.aiPattern as AiPattern,
        } as Prisma.SolutionArchitectureUncheckedCreateInput,
      });
    }),

  setLlmContext: auditedProcedure
    .use(roleMiddleware(architectRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        elements: z.array(
          z.object({
            id: z.string(),
            entersLlmContext: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      for (const el of input.elements) {
        await ctx.scopedDb.sensitiveDataElement.updateMany({
          where: { id: el.id, useCaseId: input.useCaseId, tenantId },
          data: { entersLlmContext: el.entersLlmContext as never },
        });
      }

      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          sensitiveDataElements: true,
          solutionArchitecture: true,
        },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const allAnswered = useCase.sensitiveDataElements.every(
        (e) => e.entersLlmContext != null,
      );

      let controlsPreview: ReturnType<typeof determineControls> = [];
      if (allAnswered && useCase.solutionArchitecture) {
        controlsPreview = determineControls(
          useCase.sensitiveDataElements,
          {
            aiPattern: useCase.solutionArchitecture.aiPattern,
            agentWriteActions: (useCase.solutionArchitecture
              .agentWriteActions ?? []) as unknown as AgentToolSpec[],
            corpusSensitiveData:
              useCase.solutionArchitecture.corpusSensitiveData,
          },
          { dataClassification: useCase.dataClassification },
        );
      }

      return { allAnswered, controlsPreview };
    }),

  generateControls: auditedProcedure
    .use(roleMiddleware(architectRoles))
    .input(z.object({ useCaseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          sensitiveDataElements: true,
          solutionArchitecture: true,
        },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });
      if (!useCase.solutionArchitecture) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Save architecture before generating controls",
        });
      }

      const unanswered = useCase.sensitiveDataElements.filter(
        (e) => e.entersLlmContext == null,
      );
      if (unanswered.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete LLM context determination for all sensitive fields",
        });
      }

      const controls = determineControls(
        useCase.sensitiveDataElements,
        {
          aiPattern: useCase.solutionArchitecture.aiPattern,
          agentWriteActions: (useCase.solutionArchitecture.agentWriteActions ??
            []) as unknown as AgentToolSpec[],
          corpusSensitiveData: useCase.solutionArchitecture.corpusSensitiveData,
        },
        { dataClassification: useCase.dataClassification },
      );

      await ctx.scopedDb.mandatoryControl.deleteMany({
        where: { useCaseId: input.useCaseId },
      });

      for (const control of controls) {
        await ctx.scopedDb.mandatoryControl.create({
          data: {
            useCaseId: input.useCaseId,
            tenantId,
            controlCode: control.controlCode,
            controlName: control.controlName,
            controlDescription: control.controlDescription,
            triggeredBy: control.triggeredBy,
            status: ControlStatus.REQUIRED,
          },
        });
      }

      return ctx.scopedDb.mandatoryControl.findMany({
        where: { useCaseId: input.useCaseId },
      });
    }),

  getControls: protectedProcedure
    .use(roleMiddleware(architectRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      return ctx.scopedDb.mandatoryControl.findMany({
        where: { useCaseId: input.useCaseId },
        orderBy: { controlCode: "asc" },
      });
    }),

  calculateEffort: protectedProcedure
    .use(roleMiddleware(architectRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          solutionArchitecture: true,
          sourceSystemInventory: true,
          sensitiveDataElements: true,
          mandatoryControls: true,
        },
      });
      if (!useCase?.solutionArchitecture) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Architecture not found",
        });
      }

      const arch = useCase.solutionArchitecture;
      const agentTools = (arch.agentTools ?? []) as unknown as AgentToolSpec[];
      const writeActions = (arch.agentWriteActions ?? []) as unknown as AgentToolSpec[];
      const inputValidation = (arch.inputValidation ?? []) as unknown[];
      const outputValidation = (arch.outputValidation ?? []) as unknown[];

      const piiInLlm = useCase.sensitiveDataElements.some(
        (e) =>
          e.entersLlmContext === "YES_IN_PROMPT" ||
          e.entersLlmContext === "YES_IN_RAG",
      );

      const estimate = calculateEffort({
        sourceSystemCount: useCase.sourceSystemInventory.length,
        integrationComplexity: Math.min(
          5,
          useCase.sourceSystemInventory.length + 1,
        ),
        piiInLlm,
        aiPattern: arch.aiPattern,
        guardrailCount: inputValidation.length + outputValidation.length,
        corpusDocCount: arch.ragCorpusDocCount ?? 0,
        agentToolCount: agentTools.length,
        writeActionCount: writeActions.length,
        autonomyLevel: useCase.autonomyLevel ?? 2,
        endUserPersonaCount: (useCase.endUserPersonas ?? "")
          .split(",")
          .filter(Boolean).length || 1,
        haRequired: (arch.haRequirements ?? "").includes("99"),
        redTeamRequired: (arch.redTeamScope ?? "") !== "Not required",
        monthlyLlmCost: arch.estMonthlyLlmCost ?? undefined,
        monthlyInfraCost: arch.estMonthlyInfraCost ?? undefined,
      });

      return estimate;
    }),

  saveEffort: auditedProcedure
    .use(roleMiddleware(architectRoles))
    .input(z.object({ useCaseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          solutionArchitecture: true,
          sourceSystemInventory: true,
          sensitiveDataElements: true,
        },
      });
      if (!useCase?.solutionArchitecture) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Architecture not found" });
      }

      const arch = useCase.solutionArchitecture;
      const agentTools = (arch.agentTools ?? []) as unknown as AgentToolSpec[];
      const writeActions = (arch.agentWriteActions ?? []) as unknown as AgentToolSpec[];
      const inputValidation = (arch.inputValidation ?? []) as unknown[];
      const outputValidation = (arch.outputValidation ?? []) as unknown[];
      const piiInLlm = useCase.sensitiveDataElements.some(
        (e) =>
          e.entersLlmContext === "YES_IN_PROMPT" ||
          e.entersLlmContext === "YES_IN_RAG",
      );

      const estimate = calculateEffort({
        sourceSystemCount: useCase.sourceSystemInventory.length,
        integrationComplexity: Math.min(
          5,
          useCase.sourceSystemInventory.length + 1,
        ),
        piiInLlm,
        aiPattern: arch.aiPattern,
        guardrailCount: inputValidation.length + outputValidation.length,
        corpusDocCount: arch.ragCorpusDocCount ?? 0,
        agentToolCount: agentTools.length,
        writeActionCount: writeActions.length,
        autonomyLevel: useCase.autonomyLevel ?? 2,
        endUserPersonaCount: (useCase.endUserPersonas ?? "")
          .split(",")
          .filter(Boolean).length || 1,
        haRequired: (arch.haRequirements ?? "").includes("99"),
        redTeamRequired: (arch.redTeamScope ?? "") !== "Not required",
        monthlyLlmCost: arch.estMonthlyLlmCost ?? undefined,
        monthlyInfraCost: arch.estMonthlyInfraCost ?? undefined,
      });

      const existing = await ctx.scopedDb.effortEstimate.findUnique({
        where: { useCaseId: input.useCaseId },
      });

      const data = {
        dataEngineeringHrs: estimate.dataEngineeringHrs,
        integrationHrs: estimate.integrationHrs,
        aiDevelopmentHrs: estimate.aiDevelopmentHrs,
        securityComplianceHrs: estimate.securityComplianceHrs,
        testingHrs: estimate.testingHrs,
        infrastructureHrs: estimate.infrastructureHrs,
        changeMgmtHrs: estimate.changeMgmtHrs,
        totalEstimatedHrs: estimate.totalEstimatedHrs,
        calculatedCostBand: estimate.calculatedCostBand as never,
        estMonthlyRunCost: estimate.estMonthlyRunCost,
        lastCalculatedAt: new Date(),
        createdById: ctx.user.id,
      };

      if (existing) {
        await ctx.scopedDb.effortEstimate.update({
          where: { useCaseId: input.useCaseId },
          data,
        });
      } else {
        await ctx.scopedDb.effortEstimate.create({
          data: { useCaseId: input.useCaseId, tenantId, ...data },
        });
      }

      await ctx.scopedDb.useCase.update({
        where: { id: input.useCaseId },
        data: { costBand: estimate.calculatedCostBand as never },
      });

      return estimate;
    }),

  complete: auditedProcedure
    .use(roleMiddleware(architectRoles))
    .input(z.object({ useCaseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          solutionArchitecture: true,
          mandatoryControls: true,
          sensitiveDataElements: true,
        },
      });
      if (!useCase?.solutionArchitecture) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Architecture must be saved first",
        });
      }

      if (useCase.mandatoryControls.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Generate mandatory controls before completing architecture",
        });
      }

      await ctx.scopedDb.solutionArchitecture.update({
        where: { useCaseId: input.useCaseId },
        data: { status: "APPROVED" },
      });

      if (useCase.currentStage === LifecycleStage.DEEP_FEASIBILITY) {
        return useCase;
      }

      await ensureStage({
        scopedDb: ctx.scopedDb,
        useCaseId: input.useCaseId,
        tenantId,
        userId: ctx.user.id,
        currentStage: useCase.currentStage,
        targetStage: LifecycleStage.DEEP_FEASIBILITY,
        portfolioScored: useCase.priorityScore != null,
        notes: "Architecture complete",
      });

      return ctx.scopedDb.useCase.findFirst({ where: { id: input.useCaseId } });
    }),
});
