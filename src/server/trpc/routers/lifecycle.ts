import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "../trpc";
import { protectedProcedure } from "../procedures";
import {
  buildTransitionContext,
  getAvailableTransitions,
  transitionAsync,
} from "@/server/services/workflow-engine";
import type { LifecycleStage } from "@/lib/types";

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

export const lifecycleRouter = createTRPCRouter({
  getEvents: protectedProcedure
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      return ctx.scopedDb.lifecycleEvent.findMany({
        where: { useCaseId: input.useCaseId },
        orderBy: { transitionedAt: "asc" },
        include: {
          transitionedBy: { select: { name: true } },
        },
      });
    }),

  getAvailableTransitions: protectedProcedure
    .input(z.object({ useCaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      const base = await buildTransitionContext(ctx.scopedDb, input.useCaseId);
      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return getAvailableTransitions({
        ...base,
        userRole: ctx.access!.effectiveRole,
      });
    }),

  transition: protectedProcedure
    .input(
      z.object({
        useCaseId: z.string(),
        targetStage: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireTenantId(ctx);
      const base = await buildTransitionContext(ctx.scopedDb, input.useCaseId);
      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const result = await transitionAsync(ctx.scopedDb, {
        ...base,
        userId: ctx.session!.user!.id,
        userRole: ctx.access!.effectiveRole,
        userEmail: ctx.session!.user!.email ?? undefined,
        targetStage: input.targetStage as LifecycleStage,
        notes: input.notes,
        notifyUserIds: [ctx.session!.user!.id],
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.reasons.join("; "),
        });
      }

      return result;
    }),
});
