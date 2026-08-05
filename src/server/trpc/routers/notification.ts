import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "../trpc";
import { protectedProcedure } from "../procedures";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(30),
          unreadOnly: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const limit = input?.limit ?? 30;

      const where: {
        userId: string;
        isRead?: boolean;
        OR?: Array<{ tenantId: string | null } | { tenantId: { in: string[] } }>;
      } = { userId };

      if (input?.unreadOnly) {
        where.isRead = false;
      }

      if (ctx.access?.accessibleTenantIds?.length) {
        where.OR = [
          { tenantId: null },
          { tenantId: { in: ctx.access.accessibleTenantIds } },
        ];
      }

      const notifications = await ctx.db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      const unreadCount = await ctx.db.notification.count({
        where: { ...where, isRead: false },
      });

      return { notifications, unreadCount };
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findFirst({
        where: { id: input.id, userId: ctx.session!.user!.id },
      });
      if (!notification) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.notification.update({
        where: { id: input.id },
        data: { isRead: true },
      });

      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session!.user!.id;
    await ctx.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }),
});
