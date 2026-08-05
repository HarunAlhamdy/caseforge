import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { SecurityRole } from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { auditedProcedure, protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import { calculateFinancialSummary } from "@/lib/scoring/financial-calculator";

const financialRoles: SecurityRole[] = [
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

export const financialRouter = createTRPCRouter({
  get: protectedProcedure
    .use(roleMiddleware(financialRoles))
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
        include: {
          financialModel: true,
          effortEstimate: true,
          solutionArchitecture: true,
        },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      let model = useCase.financialModel;
      if (!model) {
        const currentTotal =
          (useCase.annualCost ?? 0) +
          (useCase.currentFtes ?? 0) * 75000 * 0.3;

        model = await ctx.scopedDb.financialModel.create({
          data: {
            useCaseId: input.useCaseId,
            tenantId,
            currentLaborDirect: useCase.currentFtes
              ? useCase.currentFtes * 75000
              : undefined,
            currentTotal,
            devInternalOnetime: useCase.effortEstimate?.totalEstimatedHrs
              ? useCase.effortEstimate.totalEstimatedHrs * 100
              : undefined,
            llmApiAnnual: useCase.solutionArchitecture?.estMonthlyLlmCost
              ? useCase.solutionArchitecture.estMonthlyLlmCost * 12
              : undefined,
            infraAnnual: useCase.solutionArchitecture?.estMonthlyInfraCost
              ? useCase.solutionArchitecture.estMonthlyInfraCost * 12
              : undefined,
          },
        });
      }

      const annualBenefit = useCase.annualCost ?? model.currentTotal ?? 0;
      const totalOnetime =
        (model.devInternalOnetime ?? 0) +
        (model.devExternalOnetime ?? 0) +
        (model.integrationOnetime ?? 0) +
        (model.testingOnetime ?? 0) +
        (model.changeMgmtOnetime ?? 0);
      const totalAnnualOpex =
        (model.llmApiAnnual ?? 0) +
        (model.infraAnnual ?? 0) +
        (model.maintenanceAnnual ?? 0) +
        (model.monitoringAnnual ?? 0) +
        (model.hitlLaborAnnual ?? 0);

      const summary = calculateFinancialSummary({
        currentTotal: model.currentTotal ?? 0,
        agenticTotalOnetime: totalOnetime,
        agenticTotalAnnualOpex: totalAnnualOpex,
        annualBenefit,
        implementationCost: totalOnetime,
      });

      return { model, useCase, summary, totalOnetime, totalAnnualOpex };
    }),

  save: auditedProcedure
    .use(roleMiddleware(financialRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        data: z.object({
          currentLaborDirect: z.number().optional(),
          currentLaborMgmt: z.number().optional(),
          currentErrorCost: z.number().optional(),
          currentSlaPenalty: z.number().optional(),
          currentOpportunityCost: z.number().optional(),
          currentToolCost: z.number().optional(),
          devInternalOnetime: z.number().optional(),
          devExternalOnetime: z.number().optional(),
          llmApiAnnual: z.number().optional(),
          infraAnnual: z.number().optional(),
          integrationOnetime: z.number().optional(),
          testingOnetime: z.number().optional(),
          changeMgmtOnetime: z.number().optional(),
          maintenanceAnnual: z.number().optional(),
          monitoringAnnual: z.number().optional(),
          hitlLaborAnnual: z.number().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const currentTotal =
        (input.data.currentLaborDirect ?? 0) +
        (input.data.currentLaborMgmt ?? 0) +
        (input.data.currentErrorCost ?? 0) +
        (input.data.currentSlaPenalty ?? 0) +
        (input.data.currentOpportunityCost ?? 0) +
        (input.data.currentToolCost ?? 0);

      const totalOnetime =
        (input.data.devInternalOnetime ?? 0) +
        (input.data.devExternalOnetime ?? 0) +
        (input.data.integrationOnetime ?? 0) +
        (input.data.testingOnetime ?? 0) +
        (input.data.changeMgmtOnetime ?? 0);

      const totalAnnualOpex =
        (input.data.llmApiAnnual ?? 0) +
        (input.data.infraAnnual ?? 0) +
        (input.data.maintenanceAnnual ?? 0) +
        (input.data.monitoringAnnual ?? 0) +
        (input.data.hitlLaborAnnual ?? 0);

      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.useCaseId, tenantId },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const summary = calculateFinancialSummary({
        currentTotal,
        agenticTotalOnetime: totalOnetime,
        agenticTotalAnnualOpex: totalAnnualOpex,
        annualBenefit: useCase.annualCost ?? currentTotal,
        implementationCost: totalOnetime,
      });

      const existing = await ctx.scopedDb.financialModel.findUnique({
        where: { useCaseId: input.useCaseId },
      });

      const payload = {
        ...input.data,
        currentTotal,
        totalOnetime,
        totalAnnualOpex,
        netAnnualBenefit: summary.netAnnualBenefit,
        paybackMonths: summary.paybackMonths,
        year1Roi: summary.year1Roi,
        npv3yr: summary.npv,
      };

      if (existing) {
        await ctx.scopedDb.financialModel.update({
          where: { useCaseId: input.useCaseId },
          data: payload,
        });
      } else {
        await ctx.scopedDb.financialModel.create({
          data: { useCaseId: input.useCaseId, tenantId, ...payload },
        });
      }

      return { ...payload, summary };
    }),
});
