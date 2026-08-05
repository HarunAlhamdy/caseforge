import type { LifecycleStage } from "@/lib/types";
import { isValidTransition } from "./stage-transitions";

export interface TransitionGuardContext {
  currentStage: LifecycleStage;
  targetStage: LifecycleStage;
  gateDecision?: string;
  profileReviewsComplete?: boolean;
  portfolioScored?: boolean;
  feasibilityComplete?: boolean;
  waveAssigned?: boolean;
  pilotVerified?: boolean;
  intakeComplete?: boolean;
  userRole?: string;
}

export interface GuardResult {
  allowed: boolean;
  reasons: string[];
}

const DELIVERY_ROLES = new Set([
  "PORTFOLIO_MANAGER",
  "CUSTOMER_ADMIN",
  "EVALUATOR",
  "PLATFORM_SUPER_ADMIN",
  "PARTNER_ADMIN",
  "PARTNER_CONSULTANT",
]);

const SUBMITTER_ROLES = new Set(["SUBMITTER", "CUSTOMER_ADMIN", "PLATFORM_SUPER_ADMIN"]);

export function checkTransitionGuards(
  ctx: TransitionGuardContext,
): GuardResult {
  const reasons: string[] = [];

  if (!isValidTransition(ctx.currentStage, ctx.targetStage)) {
    reasons.push(
      `Invalid transition from ${ctx.currentStage} to ${ctx.targetStage}`,
    );
    return { allowed: false, reasons };
  }

  if (
    ctx.targetStage === "INTAKE_COMPLETE" &&
    ctx.intakeComplete === false
  ) {
    reasons.push("Required intake fields must be completed");
  }

  if (
    ctx.targetStage === "PORTFOLIO_SCORING" &&
    ctx.gateDecision !== "PASS"
  ) {
    reasons.push("Gating review must pass before portfolio scoring");
  }

  if (
    ctx.currentStage === "GATING_REVIEW" &&
    ctx.targetStage === "PROFILE_REVIEW" &&
    ctx.gateDecision !== "PASS"
  ) {
    reasons.push("Gate decision must be PASS to enter profile review");
  }

  if (
    ctx.targetStage === "DEEP_FEASIBILITY" &&
    !ctx.portfolioScored
  ) {
    reasons.push("Portfolio scoring must be complete");
  }

  if (
    ctx.targetStage === "WAVE_PLANNING" &&
    !ctx.feasibilityComplete
  ) {
    reasons.push("Deep feasibility assessment must be complete");
  }

  if (
    ctx.targetStage === "PILOT" &&
    !ctx.waveAssigned
  ) {
    reasons.push("Wave assignment required before pilot");
  }

  if (
    ctx.targetStage === "SCALE_UP" &&
    !ctx.pilotVerified
  ) {
    reasons.push("Pilot checkpoint must be verified before scale-up");
  }

  if (
    ctx.targetStage === "PRODUCTION" &&
    !ctx.pilotVerified
  ) {
    reasons.push("Scale-up controls must be verified before production");
  }

  if (
    ctx.targetStage === "PROFILE_REVIEW" &&
    ctx.profileReviewsComplete === false
  ) {
    // Allow entering profile review; completion required to leave
  }

  if (
    ctx.currentStage === "PROFILE_REVIEW" &&
    ctx.targetStage === "PORTFOLIO_SCORING" &&
    !ctx.profileReviewsComplete
  ) {
    reasons.push("All profile reviews must be complete");
  }

  if (ctx.targetStage === "RETIRED" && ctx.userRole) {
    if (!DELIVERY_ROLES.has(ctx.userRole) && ctx.userRole !== "EXECUTIVE_SPONSOR") {
      reasons.push("Only delivery or executive roles may retire use cases");
    }
  }

  if (
    ctx.targetStage === "INTAKE_COMPLETE" &&
    ctx.userRole &&
    !SUBMITTER_ROLES.has(ctx.userRole) &&
    !DELIVERY_ROLES.has(ctx.userRole)
  ) {
    reasons.push("Insufficient role to submit intake");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export function getGuardRequirements(
  targetStage: LifecycleStage,
): string[] {
  const requirements: Record<string, string[]> = {
    INTAKE_COMPLETE: ["Required intake fields completed"],
    PORTFOLIO_SCORING: ["Gating review passed"],
    DEEP_FEASIBILITY: ["Portfolio scoring complete"],
    WAVE_PLANNING: ["Deep feasibility complete"],
    PILOT: ["Wave assigned"],
    SCALE_UP: ["Pilot checkpoint verified"],
    PRODUCTION: ["Scale-up controls verified"],
    RETIRED: ["Authorized role"],
  };
  return requirements[targetStage] ?? [];
}
