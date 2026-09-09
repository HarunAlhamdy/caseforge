import { LifecycleStage } from "@/lib/constants/enums";
import type { LifecycleStage as LifecycleStageType } from "@/lib/types";

export const STAGE_TRANSITIONS: Record<
  LifecycleStageType,
  LifecycleStageType[]
> = {
  INTAKE_DRAFT: ["INTAKE_COMPLETE", "ON_HOLD"],
  INTAKE_COMPLETE: ["PENDING_REVIEW", "INTAKE_DRAFT"],
  PENDING_REVIEW: ["GATING_REVIEW", "INFO_REQUEST", "ON_HOLD"],
  INFO_REQUEST: ["PENDING_REVIEW", "ON_HOLD"],
  GATING_REVIEW: ["PROFILE_REVIEW", "PORTFOLIO_SCORING", "GATED_OUT", "ON_HOLD", "INFO_REQUEST"],
  PROFILE_REVIEW: ["PORTFOLIO_SCORING", "ON_HOLD"],
  PORTFOLIO_SCORING: ["DEEP_FEASIBILITY", "GATED_OUT", "ON_HOLD"],
  DEEP_FEASIBILITY: ["WAVE_PLANNING", "GATED_OUT", "ON_HOLD"],
  WAVE_PLANNING: ["PILOT", "ON_HOLD"],
  PILOT: ["SCALE_UP", "GATED_OUT", "ON_HOLD", "DEEP_FEASIBILITY"],
  SCALE_UP: ["PRODUCTION", "GATED_OUT", "ON_HOLD", "DEEP_FEASIBILITY"],
  PRODUCTION: ["RETIRED", "ON_HOLD", "DEEP_FEASIBILITY"],
  ON_HOLD: [
    "INTAKE_DRAFT",
    "PENDING_REVIEW",
    "GATING_REVIEW",
    "PROFILE_REVIEW",
    "PORTFOLIO_SCORING",
    "DEEP_FEASIBILITY",
    "WAVE_PLANNING",
    "PILOT",
    "SCALE_UP",
    "PRODUCTION",
  ],
  GATED_OUT: ["RETIRED"],
  RETIRED: [],
};

export function getValidTransitions(
  from: LifecycleStageType,
): LifecycleStageType[] {
  return STAGE_TRANSITIONS[from] ?? [];
}

export function isValidTransition(
  from: LifecycleStageType,
  to: LifecycleStageType,
): boolean {
  return getValidTransitions(from).includes(to);
}

export function getStageLabel(stage: LifecycleStageType): string {
  const labels: Record<string, string> = {
    [LifecycleStage.INTAKE_DRAFT]: "Intake Draft",
    [LifecycleStage.INTAKE_COMPLETE]: "Intake Complete",
    [LifecycleStage.PENDING_REVIEW]: "Pending Review",
    [LifecycleStage.INFO_REQUEST]: "Info Request",
    [LifecycleStage.GATING_REVIEW]: "Gating Review",
    [LifecycleStage.PROFILE_REVIEW]: "Profile Review",
    [LifecycleStage.PORTFOLIO_SCORING]: "Portfolio Scoring",
    [LifecycleStage.DEEP_FEASIBILITY]: "Deep Feasibility",
    [LifecycleStage.WAVE_PLANNING]: "Wave Planning",
    [LifecycleStage.PILOT]: "Pilot",
    [LifecycleStage.SCALE_UP]: "Scale Up",
    [LifecycleStage.PRODUCTION]: "Production",
    [LifecycleStage.ON_HOLD]: "On Hold",
    [LifecycleStage.GATED_OUT]: "Gated Out",
    [LifecycleStage.RETIRED]: "Retired",
  };
  return labels[stage] ?? stage;
}
