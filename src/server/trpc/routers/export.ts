import { TRPCError } from "@trpc/server";
import { UseCaseStatus } from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { protectedProcedure } from "../procedures";
import {
  buildGateReportWorkbook,
  buildPortfolioWorkbook,
} from "@/server/services/import-export-service";

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

export const exportRouter = createTRPCRouter({
  ping: protectedProcedure.query(() => ({ router: "export", ok: true })),

  portfolioExcel: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = requireTenantId(ctx);
    const useCases = await ctx.scopedDb.useCase.findMany({
      where: { tenantId, status: UseCaseStatus.ACTIVE },
      orderBy: { rank: "asc" },
    });

    const rows = useCases.map((uc) => ({
      Rank: uc.rank,
      "Use Case #": uc.useCaseNumber,
      Title: uc.title,
      Directorate: uc.businessUnit,
      Stage: uc.currentStage,
      Value: uc.valueScore,
      Feasibility: uc.feasibilityScore,
      Risk: uc.riskScore,
      Tier: uc.riskTier,
      Priority: uc.priorityScore,
      Wave: uc.wave,
    }));

    const buf = buildPortfolioWorkbook(rows);
    return {
      fileName: `portfolio-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
      base64: Buffer.from(buf).toString("base64"),
    };
  }),

  gateReportExcel: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = requireTenantId(ctx);
    const gated = await ctx.scopedDb.useCase.findMany({
      where: { tenantId, currentStage: "GATED_OUT" },
    });

    const rows = gated.map((uc) => ({
      "Use Case #": uc.useCaseNumber,
      Title: uc.title,
      "Business Unit": uc.businessUnit,
      "Gate Decision": uc.gateDecision,
      Rationale: uc.gateRationale,
    }));

    const buf = buildGateReportWorkbook(rows);
    return {
      fileName: `gate-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
      base64: Buffer.from(buf).toString("base64"),
    };
  }),
});
