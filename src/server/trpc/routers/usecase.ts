import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  GateDecision,
  LifecycleStage,
  SecurityRole,
  UseCaseStatus,
  type Prisma,
} from "@prisma/client";
import { createTRPCRouter } from "../trpc";
import { auditedProcedure, protectedProcedure } from "../procedures";
import { roleMiddleware } from "../middleware";
import { useCaseUpdateInputSchema } from "@/lib/intake/schema";
import {
  areAllMandatorySectionsComplete,
  calculateCompletionPercent,
} from "@/lib/intake/completion";
import {
  actionItemFromIntake,
  intakeValuesToUseCaseData,
  mapUseCaseToIntakeValues,
} from "@/lib/intake/mappers";
import type { IntakeFormConfig } from "@/lib/types";
import { DEFAULT_SCORING_TEMPLATE } from "@/lib/constants/scoring-template";
import {
  createInAppNotification,
  ensureStage,
  executeStageTransition,
} from "@/server/services/lifecycle-service";
import { createStorageService } from "@/server/services/storage-service";
import { PROFILE_REVIEW_SECTIONS } from "./profileReview.shared";

const submitterRoles: SecurityRole[] = [
  SecurityRole.SUBMITTER,
  SecurityRole.CUSTOMER_ADMIN,
  SecurityRole.PORTFOLIO_MANAGER,
  SecurityRole.PLATFORM_SUPER_ADMIN,
];

const portfolioRoles: SecurityRole[] = [
  SecurityRole.PORTFOLIO_MANAGER,
  SecurityRole.CUSTOMER_ADMIN,
  SecurityRole.PLATFORM_SUPER_ADMIN,
  SecurityRole.PARTNER_ADMIN,
];

function requireTenantId(ctx: {
  access: NonNullable<
    Awaited<ReturnType<typeof import("../context").createContext>>["access"]
  >;
}) {
  if (!ctx.access.tenantId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Select a tenant context for this operation",
    });
  }
  return ctx.access.tenantId;
}

function parseIntakeConfig(raw: unknown): IntakeFormConfig {
  if (raw && typeof raw === "object" && "sections" in (raw as object)) {
    return raw as IntakeFormConfig;
  }
  if (raw && typeof raw === "object" && "intake" in (raw as object)) {
    return (raw as { intake: IntakeFormConfig }).intake;
  }
  return DEFAULT_SCORING_TEMPLATE.intakeFormConfig;
}

async function generateUseCaseNumber(
  scopedDb: Prisma.TransactionClient | typeof import("@/server/db/client").prisma,
  tenantId: string,
): Promise<string> {
  const count = await scopedDb.useCase.count({ where: { tenantId } });
  return `UC-${String(count + 1).padStart(4, "0")}`;
}

async function getTenantIntakeConfig(
  scopedDb: Prisma.TransactionClient | typeof import("@/server/db/client").prisma,
  tenantId: string,
): Promise<IntakeFormConfig> {
  const tenant = await scopedDb.tenant.findUnique({
    where: { id: tenantId },
    select: { intakeFormConfig: true },
  });
  return parseIntakeConfig(tenant?.intakeFormConfig);
}

async function assertEditableBySubmitter(
  useCase: { submittedById: string; currentStage: LifecycleStage },
  userId: string,
  role: SecurityRole,
) {
  const adminRoles: SecurityRole[] = [
    SecurityRole.CUSTOMER_ADMIN,
    SecurityRole.PORTFOLIO_MANAGER,
    SecurityRole.PLATFORM_SUPER_ADMIN,
  ];
  if (adminRoles.includes(role)) return;

  if (useCase.submittedById !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not your submission" });
  }

  if (
    useCase.currentStage !== LifecycleStage.INTAKE_DRAFT &&
    useCase.currentStage !== LifecycleStage.INFO_REQUEST
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use case is not editable in the current stage",
    });
  }
}

async function performSubmit(
  ctx: {
    scopedDb: typeof import("@/server/db/client").prisma;
    user: { id: string };
    access: NonNullable<
      Awaited<ReturnType<typeof import("../context").createContext>>["access"]
    >;
  },
  useCaseId: string,
) {
  const tenantId = requireTenantId(ctx);
  const useCase = await ctx.scopedDb.useCase.findFirst({
    where: { id: useCaseId },
    include: {
      actionItems: { take: 1, orderBy: { followUpDate: "desc" } },
    },
  });
  if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

  await assertEditableBySubmitter(
    useCase,
    ctx.user.id,
    ctx.access.effectiveRole,
  );

  const intakeConfig = await getTenantIntakeConfig(ctx.scopedDb, tenantId);
  const values = mapUseCaseToIntakeValues(useCase);
  const action = useCase.actionItems[0];
  if (action) {
    values.recommendedAction = action.recommendedAction ?? undefined;
    values.nextStepsOwner = action.owner ?? undefined;
    values.followUpDate = action.followUpDate?.toISOString().slice(0, 10);
  }
  if (!areAllMandatorySectionsComplete(values, intakeConfig)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Mandatory sections are incomplete",
    });
  }

  const fromStage = useCase.currentStage;

  if (fromStage === LifecycleStage.INTAKE_DRAFT) {
    await executeStageTransition({
      scopedDb: ctx.scopedDb,
      useCaseId: useCase.id,
      tenantId,
      userId: ctx.user.id,
      fromStage,
      toStage: LifecycleStage.INTAKE_COMPLETE,
      notes: "Mandatory sections complete",
    });
    await executeStageTransition({
      scopedDb: ctx.scopedDb,
      useCaseId: useCase.id,
      tenantId,
      userId: ctx.user.id,
      fromStage: LifecycleStage.INTAKE_COMPLETE,
      toStage: LifecycleStage.PENDING_REVIEW,
      notes: "Intake submitted for review",
    });
  } else if (fromStage === LifecycleStage.INFO_REQUEST) {
    await executeStageTransition({
      scopedDb: ctx.scopedDb,
      useCaseId: useCase.id,
      tenantId,
      userId: ctx.user.id,
      fromStage,
      toStage: LifecycleStage.PENDING_REVIEW,
      notes: "Resubmitted after info request",
    });
  }

  const managers = await ctx.scopedDb.user.findMany({
    where: {
      tenantId,
      role: {
        in: [SecurityRole.PORTFOLIO_MANAGER, SecurityRole.CUSTOMER_ADMIN],
      },
      isActive: true,
    },
    select: { id: true },
  });

  for (const manager of managers) {
    await createInAppNotification(ctx.scopedDb, {
      tenantId,
      userId: manager.id,
      title: "New intake submitted",
      message: `${useCase.useCaseNumber} — ${useCase.title} is ready for triage.`,
      link: `/review/queue`,
    });
  }

  return ctx.scopedDb.useCase.findFirst({ where: { id: useCaseId } });
}

export const usecaseRouter = createTRPCRouter({
  create: auditedProcedure
    .use(roleMiddleware(submitterRoles))
    .input(useCaseUpdateInputSchema.optional())
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCaseNumber = await generateUseCaseNumber(ctx.scopedDb, tenantId);
      const data = intakeValuesToUseCaseData(input ?? {});

      const useCase = await ctx.scopedDb.useCase.create({
        data: {
          tenantId,
          useCaseNumber,
          submittedById: ctx.user.id,
          currentStage: LifecycleStage.INTAKE_DRAFT,
          ...data,
          title:
            (typeof data.title === "string" && data.title.trim()) ||
            input?.title?.trim() ||
            "Untitled draft",
          businessUnit:
            (typeof data.businessUnit === "string" &&
              data.businessUnit.trim()) ||
            input?.businessUnit?.trim() ||
            "Unassigned",
        },
      });

      const actionItem = actionItemFromIntake(input ?? {});
      if (actionItem) {
        await ctx.scopedDb.actionItem.create({
          data: {
            useCaseId: useCase.id,
            tenantId,
            ...actionItem,
          },
        });
      }

      return useCase;
    }),

  update: auditedProcedure
    .use(roleMiddleware(submitterRoles))
    .input(
      z.object({
        id: z.string(),
        data: useCaseUpdateInputSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const existing = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.id },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await assertEditableBySubmitter(
        existing,
        ctx.user.id,
        ctx.access.effectiveRole,
      );

      const data = intakeValuesToUseCaseData(input.data);
      const updated = await ctx.scopedDb.useCase.update({
        where: { id: input.id },
        data: data as Prisma.UseCaseUpdateInput,
      });

      const actionItem = actionItemFromIntake(input.data);
      const existingAction = await ctx.scopedDb.actionItem.findFirst({
        where: { useCaseId: input.id },
        orderBy: { followUpDate: "desc" },
      });
      if (actionItem) {
        if (existingAction) {
          await ctx.scopedDb.actionItem.update({
            where: { id: existingAction.id },
            data: actionItem,
          });
        } else {
          await ctx.scopedDb.actionItem.create({
            data: { useCaseId: input.id, tenantId, ...actionItem },
          });
        }
      } else if (
        existingAction &&
        (input.data.recommendedAction !== undefined ||
          input.data.nextStepsOwner !== undefined ||
          input.data.followUpDate !== undefined)
      ) {
        // User cleared next-steps fields — clear stored action item too
        await ctx.scopedDb.actionItem.update({
          where: { id: existingAction.id },
          data: {
            recommendedAction: null,
            owner: null,
            followUpDate: null,
          },
        });
      }

      return updated;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requireTenantId(ctx);
      const submitterFilter =
        ctx.access?.effectiveRole === SecurityRole.SUBMITTER
          ? { submittedById: ctx.user.id }
          : {};
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.id, ...submitterFilter },
        include: {
          submittedBy: { select: { id: true, name: true, email: true } },
          actionItems: { take: 1, orderBy: { followUpDate: "desc" } },
          profileReviews: true,
        },
      });
      if (!useCase) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const intakeConfig = await getTenantIntakeConfig(
        ctx.scopedDb,
        useCase.tenantId,
      );
      const values = mapUseCaseToIntakeValues(useCase);
      const action = useCase.actionItems[0];
      if (action) {
        values.recommendedAction = action.recommendedAction ?? undefined;
        values.nextStepsOwner = action.owner ?? undefined;
        values.followUpDate = action.followUpDate?.toISOString().slice(0, 10);
      }

      return {
        ...useCase,
        intakeValues: values,
        intakeConfig,
        completionPercent: calculateCompletionPercent(values, intakeConfig),
        mandatoryComplete: areAllMandatorySectionsComplete(values, intakeConfig),
      };
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          stage: z.nativeEnum(LifecycleStage).optional(),
          businessUnit: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          submittedById: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const where: Prisma.UseCaseWhereInput = { tenantId };

      if (input?.stage) where.currentStage = input.stage;
      if (input?.businessUnit) where.businessUnit = input.businessUnit;
      if (input?.submittedById) where.submittedById = input.submittedById;
      if (input?.dateFrom || input?.dateTo) {
        where.dateSubmitted = {};
        if (input.dateFrom) {
          where.dateSubmitted.gte = new Date(input.dateFrom);
        }
        if (input.dateTo) {
          where.dateSubmitted.lte = new Date(input.dateTo);
        }
      }

      if (
        ctx.access.effectiveRole === SecurityRole.SUBMITTER &&
        !input?.submittedById
      ) {
        where.submittedById = ctx.user.id;
      }

      const items = await ctx.scopedDb.useCase.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          submittedBy: { select: { name: true } },
        },
      });

      const intakeConfig = await getTenantIntakeConfig(ctx.scopedDb, tenantId);

      return items.map((item) => {
        const values = mapUseCaseToIntakeValues(item);
        return {
          ...item,
          completionPercent: calculateCompletionPercent(values, intakeConfig),
        };
      });
    }),

  submit: auditedProcedure
    .use(roleMiddleware(submitterRoles))
    .input(z.object({ id: z.string(), acknowledgedWarnings: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => performSubmit(ctx, input.id)),

  resubmit: auditedProcedure
    .use(roleMiddleware(submitterRoles))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => performSubmit(ctx, input.id)),

  uploadAttachment: protectedProcedure
    .use(roleMiddleware(submitterRoles))
    .input(
      z.object({
        useCaseId: z.string(),
        fileName: z.string(),
        contentType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const storage = createStorageService();
      const key = `${tenantId}/${input.useCaseId}/${input.fileName}`;
      const uploadUrl = await storage.getUploadUrl({
        key,
        contentType: input.contentType,
      });
      return { uploadUrl, key, publicUrl: storage.getPublicUrl(key) };
    }),

  getReviewQueue: protectedProcedure
    .use(roleMiddleware(portfolioRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantId(ctx);
      const items = await ctx.scopedDb.useCase.findMany({
        where: {
          tenantId,
          currentStage: LifecycleStage.PENDING_REVIEW,
        },
        orderBy: { dateSubmitted: "asc" },
        include: {
          submittedBy: { select: { name: true, email: true } },
        },
      });

      const now = Date.now();
      return items.map((item) => ({
        ...item,
        daysWaiting: Math.floor(
          (now - item.dateSubmitted.getTime()) / (1000 * 60 * 60 * 24),
        ),
      }));
    }),

  recordGateDecision: auditedProcedure
    .use(roleMiddleware(portfolioRoles))
    .input(
      z.object({
        id: z.string(),
        decision: z.nativeEnum(GateDecision),
        rationale: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      if (
        input.decision === GateDecision.NONE ||
        input.decision === GateDecision.HOLD
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use createInfoRequest for Hold decisions",
        });
      }

      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.id },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      const currentStage =
        useCase.currentStage === LifecycleStage.PENDING_REVIEW
          ? LifecycleStage.PENDING_REVIEW
          : useCase.currentStage;

      await ctx.scopedDb.useCase.update({
        where: { id: input.id },
        data: {
          gateDecision: input.decision,
          gateRationale: input.rationale,
          gateDecidedById: ctx.user.id,
          gateDecidedAt: new Date(),
        },
      });

      if (input.decision === GateDecision.PASS) {
        const fromStage = currentStage;
        let stageForTransition = fromStage;
        if (fromStage === LifecycleStage.PENDING_REVIEW) {
          await executeStageTransition({
            scopedDb: ctx.scopedDb,
            useCaseId: useCase.id,
            tenantId,
            userId: ctx.user.id,
            fromStage,
            toStage: LifecycleStage.GATING_REVIEW,
            notes: "Moved to gating review",
          });
          stageForTransition = LifecycleStage.GATING_REVIEW;
        }

        await executeStageTransition({
          scopedDb: ctx.scopedDb,
          useCaseId: useCase.id,
          tenantId,
          userId: ctx.user.id,
          fromStage: stageForTransition,
          toStage: LifecycleStage.PROFILE_REVIEW,
          notes: input.rationale,
          gateDecision: "PASS",
        });

        for (const section of PROFILE_REVIEW_SECTIONS) {
          const existing = await ctx.scopedDb.profileReview.findFirst({
            where: { useCaseId: useCase.id, section },
          });
          if (!existing) {
            await ctx.scopedDb.profileReview.create({
              data: {
                useCaseId: useCase.id,
                tenantId,
                section,
              },
            });
          }
        }

        const specialists = await ctx.scopedDb.user.findMany({
          where: {
            tenantId,
            role: {
              in: [
                SecurityRole.EVALUATOR,
                SecurityRole.DATA_SECURITY_REVIEWER,
                SecurityRole.CUSTOMER_ADMIN,
              ],
            },
            isActive: true,
          },
          select: { id: true },
        });

        for (const user of specialists) {
          await createInAppNotification(ctx.scopedDb, {
            tenantId,
            userId: user.id,
            title: "Profile reviews assigned",
            message: `${useCase.useCaseNumber} passed gating — specialist review required.`,
            link: `/review/profiles`,
          });
        }
      } else {
        await ensureStage({
          scopedDb: ctx.scopedDb,
          useCaseId: useCase.id,
          tenantId,
          userId: ctx.user.id,
          currentStage,
          targetStage: LifecycleStage.GATED_OUT,
          notes: input.rationale,
        });

        await ctx.scopedDb.useCase.update({
          where: { id: input.id },
          data: { status: UseCaseStatus.GATED_OUT },
        });

        await createInAppNotification(ctx.scopedDb, {
          tenantId,
          userId: useCase.submittedById,
          title: `Gated out — ${input.decision}`,
          message: input.rationale,
          link: `/intake/${useCase.id}`,
        });
      }

      return ctx.scopedDb.useCase.findFirst({ where: { id: input.id } });
    }),

  createInfoRequest: auditedProcedure
    .use(roleMiddleware(portfolioRoles))
    .input(
      z.object({
        id: z.string(),
        rationale: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = requireTenantId(ctx);
      const useCase = await ctx.scopedDb.useCase.findFirst({
        where: { id: input.id },
      });
      if (!useCase) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.scopedDb.useCase.update({
        where: { id: input.id },
        data: {
          gateDecision: GateDecision.HOLD,
          gateRationale: input.rationale,
          gateDecidedById: ctx.user.id,
          gateDecidedAt: new Date(),
        },
      });

      const fromStage = useCase.currentStage;
      await executeStageTransition({
        scopedDb: ctx.scopedDb,
        useCaseId: useCase.id,
        tenantId,
        userId: ctx.user.id,
        fromStage,
        toStage: LifecycleStage.INFO_REQUEST,
        notes: input.rationale,
      });

      await createInAppNotification(ctx.scopedDb, {
        tenantId,
        userId: useCase.submittedById,
        title: "Additional information requested",
        message: input.rationale,
        link: `/intake/${useCase.id}`,
      });

      return ctx.scopedDb.useCase.findFirst({ where: { id: input.id } });
    }),

  getGatedOutReport: protectedProcedure
    .use(roleMiddleware(portfolioRoles))
    .query(async ({ ctx }) => {
      const tenantId = requireTenantId(ctx);
      const items = await ctx.scopedDb.useCase.findMany({
        where: {
          tenantId,
          currentStage: LifecycleStage.GATED_OUT,
        },
        orderBy: { gateDecidedAt: "desc" },
      });

      const grouped: Record<string, typeof items> = {};
      for (const item of items) {
        const key = item.gateDecision;
        grouped[key] = grouped[key] ?? [];
        grouped[key].push(item);
      }

      return { items, grouped };
    }),
});
