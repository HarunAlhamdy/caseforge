import { TRPCError } from "@trpc/server";
import type { SecurityRole } from "@prisma/client";
import { t } from "./trpc";
import { AccessResolver } from "@/server/services/access-resolver";
import type { AccessContext } from "@/lib/types";

export const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

export const tenantMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const resolver = new AccessResolver(ctx.db);
  const access = await resolver.resolve(
    ctx.session,
    ctx.activeTenantId ?? ctx.session.user.tenantId,
  );

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
      access,
    },
  });
});

export function roleMiddleware(allowedRoles: SecurityRole[]) {
  return t.middleware(({ ctx, next }) => {
    const access = ctx.access as AccessContext | null | undefined;
    if (!access) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (!allowedRoles.includes(access.effectiveRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient role for this operation",
      });
    }

    return next({ ctx: { ...ctx, access } });
  });
}

export const auditMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const result = await next();

  if (type !== "mutation" || !ctx.session?.user?.id) {
    return result;
  }

  try {
    const access = ctx.access as AccessContext | null | undefined;
    await ctx.db.auditLog.create({
      data: {
        userId: ctx.session.user.id,
        tenantId: access?.tenantId ?? ctx.session.user.tenantId ?? null,
        partnerId: access?.partnerId ?? ctx.session.user.partnerId ?? null,
        entityType: "TRPC",
        entityId: path,
        action: type,
        afterJson: { path, type },
      },
    });
  } catch {
    // Best-effort audit logging — never block the mutation
  }

  return result;
});

/** @deprecated Use authMiddleware */
export const enforceAuth = authMiddleware;
