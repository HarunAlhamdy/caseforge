import type { Prisma, PrismaClient } from "@prisma/client";
import { SecurityRole } from "@/lib/constants/enums";

export interface TenantScopeContext {
  tenantId?: string | null;
  role?: string;
  accessibleTenantIds?: string[];
}

/** Models that carry a `tenantId` column and should be auto-scoped. */
const TENANT_SCOPED_MODELS = new Set([
  "CustomerAssignment",
  "UseCase",
  "SourceSystem",
  "SensitiveDataElement",
  "SolutionArchitecture",
  "FinancialModel",
  "EffortEstimate",
  "MandatoryControl",
  "ScoringModel",
  "HardGate",
  "SuccessCriteria",
  "LifecycleEvent",
  "ProfileReview",
  "ActionItem",
  "ScoringModelVersion",
  "ScoringSnapshot",
  "WeightChangeProposal",
  "Notification",
  "AuditLog",
  "User",
]);

function shouldSkipScoping(ctx: TenantScopeContext): boolean {
  return ctx.role === SecurityRole.PLATFORM_SUPER_ADMIN;
}

function buildTenantFilter(
  ctx: TenantScopeContext,
): Prisma.StringFilter | Prisma.StringNullableFilter | undefined {
  if (ctx.tenantId) {
    return { equals: ctx.tenantId };
  }
  if (ctx.accessibleTenantIds && ctx.accessibleTenantIds.length > 0) {
    return { in: ctx.accessibleTenantIds };
  }
  return undefined;
}

function mergeWhere<T extends Record<string, unknown>>(
  where: T | undefined,
  tenantFilter: Prisma.StringFilter | Prisma.StringNullableFilter,
): T {
  const base = (where ?? {}) as T & { tenantId?: unknown };
  if (base.tenantId !== undefined) {
    return base as T;
  }
  return { ...base, tenantId: tenantFilter } as T;
}

function injectTenantIntoData(
  data: Record<string, unknown>,
  tenantId: string,
): Record<string, unknown> {
  if (data.tenantId !== undefined) {
    return data;
  }
  return { ...data, tenantId };
}

function injectTenantIntoCreateArgs(
  args: { data?: unknown },
  tenantId: string,
): void {
  if (!args.data) return;

  if (Array.isArray(args.data)) {
    args.data = args.data.map((item) =>
      injectTenantIntoData(item as Record<string, unknown>, tenantId),
    );
  } else {
    args.data = injectTenantIntoData(
      args.data as Record<string, unknown>,
      tenantId,
    );
  }
}

type QueryArgs = {
  where?: Record<string, unknown>;
  data?: unknown;
};

/**
 * Returns a Prisma client extended with automatic tenant scoping.
 *
 * - `findMany`, `findFirst`, and `count` receive a tenantId filter when context provides one
 * - `create` sets tenantId on new records
 * - Platform super admins bypass all scoping
 * - Partner cross-customer views use `accessibleTenantIds`
 */
export function createTenantScopedClient(
  base: PrismaClient,
  ctx: TenantScopeContext,
): PrismaClient {
  if (shouldSkipScoping(ctx)) {
    return base;
  }

  const tenantFilter = buildTenantFilter(ctx);
  const createTenantId = ctx.tenantId ?? undefined;

  return base.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model) || !tenantFilter) {
            return query(args);
          }
          const q = args as QueryArgs;
          q.where = mergeWhere(q.where, tenantFilter);
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model) || !tenantFilter) {
            return query(args);
          }
          const q = args as QueryArgs;
          q.where = mergeWhere(q.where, tenantFilter);
          return query(args);
        },
        async count({ model, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model) || !tenantFilter) {
            return query(args);
          }
          const q = args as QueryArgs;
          q.where = mergeWhere(q.where, tenantFilter);
          return query(args);
        },
        async create({ model, args, query }) {
          if (
            TENANT_SCOPED_MODELS.has(model) &&
            createTenantId
          ) {
            injectTenantIntoCreateArgs(args as QueryArgs, createTenantId);
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (
            TENANT_SCOPED_MODELS.has(model) &&
            createTenantId
          ) {
            injectTenantIntoCreateArgs(args as QueryArgs, createTenantId);
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}

/** @deprecated Use createTenantScopedClient instead */
export function applyTenantMiddleware(
  client: PrismaClient,
  tenantId: string | null | undefined,
): PrismaClient {
  return createTenantScopedClient(client, { tenantId });
}
