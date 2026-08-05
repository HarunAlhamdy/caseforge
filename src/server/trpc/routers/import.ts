import { z } from "zod";
import { createTRPCRouter } from "../trpc";
import { protectedProcedure } from "../procedures";

export const importRouter = createTRPCRouter({
  ping: protectedProcedure.query(() => ({ router: "import", ok: true })),

  portfolioExcel: protectedProcedure
    .input(z.object({ base64: z.string(), fileName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { importPortfolioFromExcel } = await import(
        "@/server/services/import-export-service"
      );
      if (!ctx.access?.tenantId) {
        throw new Error("Select a tenant context");
      }
      return importPortfolioFromExcel(
        ctx.scopedDb,
        ctx.access.tenantId,
        ctx.session!.user!.id,
        input.base64,
      );
    }),
});
