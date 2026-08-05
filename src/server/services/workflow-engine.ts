import type { PrismaClient } from "@prisma/client";
import type { LifecycleStage } from "@/lib/types";
import {
  checkTransitionGuards,
  type GuardResult,
} from "@/lib/workflow/transition-guards";
import {
  getValidTransitions,
  getStageLabel,
  isValidTransition,
} from "@/lib/workflow/stage-transitions";
import {
  notifyStageTransition,
  notifyConsultantAssignment,
  notifyWeightChange,
} from "./notification-service";

export interface UseCaseTransitionContext {
  useCaseId: string;
  tenantId: string;
  userId: string;
  currentStage: LifecycleStage;
  gateDecision?: string;
  profileReviewsComplete?: boolean;
  portfolioScored?: boolean;
  feasibilityComplete?: boolean;
  waveAssigned?: boolean;
  pilotVerified?: boolean;
  intakeComplete?: boolean;
  userRole?: string;
  userEmail?: string;
  useCaseTitle?: string;
  notifyUserIds?: string[];
}

export interface TransitionResult {
  success: boolean;
  reasons: string[];
  newStage?: LifecycleStage;
}

export function checkGuards(
  ctx: Omit<UseCaseTransitionContext, "useCaseId" | "tenantId" | "userId"> & {
    targetStage: LifecycleStage;
  },
): GuardResult {
  return checkTransitionGuards({
    currentStage: ctx.currentStage,
    targetStage: ctx.targetStage,
    gateDecision: ctx.gateDecision,
    profileReviewsComplete: ctx.profileReviewsComplete,
    portfolioScored: ctx.portfolioScored,
    feasibilityComplete: ctx.feasibilityComplete,
    waveAssigned: ctx.waveAssigned,
    pilotVerified: ctx.pilotVerified,
    intakeComplete: ctx.intakeComplete,
    userRole: ctx.userRole,
  });
}

export function getAvailableTransitions(
  ctx: Omit<UseCaseTransitionContext, "useCaseId" | "tenantId" | "userId">,
): Array<{ stage: LifecycleStage; label: string; allowed: boolean; reasons: string[] }> {
  const candidates = getValidTransitions(ctx.currentStage);
  return candidates.map((stage) => {
    const guard = checkGuards({ ...ctx, targetStage: stage });
    return {
      stage,
      label: getStageLabel(stage),
      allowed: guard.allowed,
      reasons: guard.reasons,
    };
  });
}

export async function transitionAsync(
  scopedDb: PrismaClient,
  params: UseCaseTransitionContext & {
    targetStage: LifecycleStage;
    notes?: string;
  },
): Promise<TransitionResult> {
  const guard = checkGuards({
    currentStage: params.currentStage,
    targetStage: params.targetStage,
    gateDecision: params.gateDecision,
    profileReviewsComplete: params.profileReviewsComplete,
    portfolioScored: params.portfolioScored,
    feasibilityComplete: params.feasibilityComplete,
    waveAssigned: params.waveAssigned,
    pilotVerified: params.pilotVerified,
    intakeComplete: params.intakeComplete,
    userRole: params.userRole,
  });

  if (!guard.allowed) {
    return { success: false, reasons: guard.reasons };
  }

  if (!isValidTransition(params.currentStage, params.targetStage)) {
    return {
      success: false,
      reasons: ["Transition not allowed by state machine"],
    };
  }

  await scopedDb.$transaction(async (tx) => {
    await tx.useCase.update({
      where: { id: params.useCaseId },
      data: { currentStage: params.targetStage },
    });

    await tx.lifecycleEvent.create({
      data: {
        useCaseId: params.useCaseId,
        tenantId: params.tenantId,
        fromStage: params.currentStage,
        toStage: params.targetStage,
        transitionedById: params.userId,
        notes: params.notes,
      },
    });
  });

  const notifyIds = params.notifyUserIds ?? [params.userId];
  await notifyStageTransition(scopedDb, {
    tenantId: params.tenantId,
    userIds: notifyIds,
    useCaseTitle: params.useCaseTitle ?? "Use case",
    useCaseId: params.useCaseId,
    fromStage: params.currentStage,
    toStage: params.targetStage,
    userEmail: params.userEmail,
  });

  return {
    success: true,
    reasons: [],
    newStage: params.targetStage,
  };
}

export async function buildTransitionContext(
  scopedDb: PrismaClient,
  useCaseId: string,
): Promise<Omit<UseCaseTransitionContext, "userId" | "userRole" | "userEmail"> | null> {
  const useCase = await scopedDb.useCase.findFirst({
    where: { id: useCaseId },
    include: {
      profileReviews: true,
      feasibilityAssessments: { take: 1 },
    },
  });
  if (!useCase) return null;

  const profileReviewsComplete =
    useCase.profileReviews.length === 0 ||
    useCase.profileReviews.every((r) => r.status === "APPROVED");

  return {
    useCaseId: useCase.id,
    tenantId: useCase.tenantId,
    currentStage: useCase.currentStage as LifecycleStage,
    gateDecision: useCase.gateDecision ?? undefined,
    profileReviewsComplete,
    portfolioScored: useCase.priorityScore != null,
    feasibilityComplete: (useCase.feasibilityAssessments?.length ?? 0) > 0,
    waveAssigned: useCase.wave != null,
    pilotVerified:
      useCase.currentStage === "SCALE_UP" ||
      useCase.currentStage === "PRODUCTION" ||
      useCase.compositeVerdict === "STRONG_GO",
    intakeComplete: Boolean(useCase.problemStatement && useCase.proposedSolution),
    useCaseTitle: useCase.title,
  };
}

export { notifyConsultantAssignment, notifyWeightChange };
