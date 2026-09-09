import { TRPCError } from "@trpc/server";
import { SecurityRole } from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import {
  getDashboardSummary,
  getExecutiveSummary,
  getPartnerDashboard,
} from "@/server/services/dashboard-service";
import * as XLSX from "xlsx";

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

export const dashboardRouter = createTRPCRouter({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = requireTenantId(ctx);
    return getDashboardSummary(ctx.scopedDb, tenantId);
  }),

  executive: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = requireTenantId(ctx);
    return getExecutiveSummary(ctx.scopedDb, tenantId);
  }),

  partnerSummary: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.access?.partnerId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Partner context required",
      });
    }
    return getPartnerDashboard(ctx.db, ctx.access.partnerId);
  }),

  partnerWorkload: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.access?.partnerId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const data = await getPartnerDashboard(ctx.db, ctx.access.partnerId);
    return { workloadByConsultant: data.workloadByConsultant };
  }),

  partnerHealth: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.access?.partnerId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const data = await getPartnerDashboard(ctx.db, ctx.access.partnerId);
    return { healthScores: data.healthScores, customers: data.customers };
  }),

  exportPortfolio: protectedProcedure
    .use(roleMiddleware([SecurityRole.PORTFOLIO_MANAGER, SecurityRole.CUSTOMER_ADMIN, SecurityRole.PARTNER_ADMIN, SecurityRole.PLATFORM_SUPER_ADMIN]))
    .mutation(async ({ ctx }) => {
    const tenantId = requireTenantId(ctx);
    const summary = await getDashboardSummary(ctx.scopedDb, tenantId);
    const rows = summary.topUseCases.map((uc) => ({
      Rank: uc.rank,
      "Use Case #": uc.number,
      Title: uc.title,
      Stage: uc.stage,
      Priority: uc.priority,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: "No scored use cases" }]);
    XLSX.utils.book_append_sheet(wb, ws, "Portfolio");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return {
      fileName: `portfolio-${tenantId.slice(0, 8)}.xlsx`,
      base64: Buffer.from(buf).toString("base64"),
    };
  }),

  exportGateReport: protectedProcedure
    .use(roleMiddleware([SecurityRole.PORTFOLIO_MANAGER, SecurityRole.CUSTOMER_ADMIN, SecurityRole.PARTNER_ADMIN, SecurityRole.PLATFORM_SUPER_ADMIN]))
    .mutation(async ({ ctx }) => {
    const tenantId = requireTenantId(ctx);
    const gated = await ctx.scopedDb.useCase.findMany({
      where: {
        tenantId,
        currentStage: "GATED_OUT",
      },
      orderBy: { dateSubmitted: "desc" },
    });

    const rows = gated.map((uc) => ({
      "Use Case #": uc.useCaseNumber,
      Title: uc.title,
      "Business Unit": uc.businessUnit,
      "Gate Decision": uc.gateDecision,
      Rationale: uc.gateRationale ?? "",
      "Submitted At": uc.dateSubmitted.toISOString().slice(0, 10),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: "No gated-out cases" }]);
    XLSX.utils.book_append_sheet(wb, ws, "Gate Report");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return {
      fileName: `gate-report-${tenantId.slice(0, 8)}.xlsx`,
      base64: Buffer.from(buf).toString("base64"),
    };
  }),
});
