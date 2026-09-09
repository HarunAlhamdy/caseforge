import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import type { LifecycleStage } from "@/lib/types";
import { checkTransitionGuards } from "@/lib/workflow/transition-guards";
import { isValidTransition } from "@/lib/workflow/stage-transitions";
import { buildTransitionContext } from "@/server/services/workflow-engine";

export interface ExecuteTransitionParams {
  scopedDb: PrismaClient;
  useCaseId: string;
  tenantId: string;
  userId: string;
  fromStage: LifecycleStage;
  toStage: LifecycleStage;
  notes?: string;
  gateDecision?: string;
  profileReviewsComplete?: boolean;
  portfolioScored?: boolean;
  feasibilityComplete?: boolean;
  waveAssigned?: boolean;
  pilotVerified?: boolean;
  intakeComplete?: boolean;
  userRole?: string;
}

export async function executeStageTransition(
  params: ExecuteTransitionParams,
): Promise<void> {
  const built = await buildTransitionContext(
    params.scopedDb,
    params.useCaseId,
  );

  const guard = checkTransitionGuards({
    currentStage: params.fromStage,
    targetStage: params.toStage,
    gateDecision: params.gateDecision ?? built?.gateDecision,
    profileReviewsComplete:
      params.profileReviewsComplete ?? built?.profileReviewsComplete,
    portfolioScored: params.portfolioScored ?? built?.portfolioScored,
    feasibilityComplete:
      params.feasibilityComplete ?? built?.feasibilityComplete,
    waveAssigned: params.waveAssigned ?? built?.waveAssigned,
    pilotVerified: params.pilotVerified ?? built?.pilotVerified,
    intakeComplete: params.intakeComplete ?? built?.intakeComplete,
    userRole: params.userRole,
  });

  if (!guard.allowed) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: guard.reasons.join("; "),
    });
  }

  if (!isValidTransition(params.fromStage, params.toStage)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Transition from ${params.fromStage} to ${params.toStage} is not allowed`,
    });
  }

  await params.scopedDb.$transaction(async (tx) => {
    await tx.useCase.update({
      where: { id: params.useCaseId },
      data: { currentStage: params.toStage },
    });

    await tx.lifecycleEvent.create({
      data: {
        useCaseId: params.useCaseId,
        tenantId: params.tenantId,
        fromStage: params.fromStage,
        toStage: params.toStage,
        transitionedById: params.userId,
        notes: params.notes,
      },
    });
  });
}

/** Move through intermediate stage when direct transition is invalid. */
export async function ensureStage(
  params: Omit<ExecuteTransitionParams, "fromStage" | "toStage"> & {
    currentStage: LifecycleStage;
    targetStage: LifecycleStage;
  },
): Promise<LifecycleStage> {
  let stage = params.currentStage;

  if (stage === params.targetStage) return stage;

  if (
    stage === "PENDING_REVIEW" &&
    params.targetStage !== "INFO_REQUEST" &&
    params.targetStage !== "ON_HOLD"
  ) {
    await executeStageTransition({
      ...params,
      fromStage: stage,
      toStage: "GATING_REVIEW",
      notes: params.notes ?? "Entered gating review",
    });
    stage = "GATING_REVIEW";
  }

  if (stage !== params.targetStage) {
    await executeStageTransition({
      ...params,
      fromStage: stage,
      toStage: params.targetStage,
    });
    stage = params.targetStage;
  }

  return stage;
}

import { createInAppNotification as notifyCreate } from "./notification-service";

export async function createInAppNotification(
  scopedDb: PrismaClient,
  data: {
    tenantId: string;
    userId: string;
    title: string;
    message: string;
    link?: string;
  },
): Promise<void> {
  await notifyCreate(scopedDb, data);
}
