import { CostBand } from "@/lib/constants/enums";
import type { AiPattern } from "@prisma/client";

export interface EffortFactors {
  sourceSystemCount: number;
  integrationComplexity: number; // 1–5
  piiInLlm: boolean;
  aiPattern: AiPattern | string;
  guardrailCount: number;
  corpusDocCount: number;
  agentToolCount: number;
  writeActionCount: number;
  autonomyLevel: number; // 1–5
  endUserPersonaCount: number;
  haRequired: boolean;
  redTeamRequired: boolean;
  blendedHourlyRate?: number;
  monthlyLlmCost?: number;
  monthlyInfraCost?: number;
  hitlHoursPerMonth?: number;
}

export interface EffortEstimate {
  dataEngineeringHrs: number;
  integrationHrs: number;
  aiDevelopmentHrs: number;
  securityComplianceHrs: number;
  testingHrs: number;
  infrastructureHrs: number;
  changeMgmtHrs: number;
  totalEstimatedHrs: number;
  calculatedCostBand: string;
  estMonthlyRunCost: number;
}

const BASE_HOURS = {
  dataEngineering: 40,
  integration: 30,
  aiDevelopment: 80,
  securityCompliance: 24,
  testing: 40,
  infrastructure: 24,
  changeMgmt: 16,
};

function patternMultiplier(pattern: string): number {
  switch (pattern) {
    case "RAG":
      return 1.3;
    case "FINE_TUNED":
      return 1.6;
    case "SINGLE_AGENT":
      return 1.4;
    case "MULTI_AGENT":
      return 1.8;
    case "CLASSIFICATION":
    case "EXTRACTION":
    case "SUMMARIZATION":
      return 1.0;
    default:
      return 1.1;
  }
}

function costBandFromHours(hours: number, rate: number): string {
  const cost = hours * rate;
  if (cost > 400_000) return CostBand.XL_OVER_400K;
  if (cost > 150_000) return CostBand.L_150K_400K;
  if (cost > 50_000) return CostBand.M_50K_150K;
  return CostBand.S_UNDER_50K;
}

export function calculateEffort(factors: EffortFactors): EffortEstimate {
  const rate = factors.blendedHourlyRate ?? 150;

  const sourceMult = 1 + Math.max(0, factors.sourceSystemCount - 1) * 0.15;
  const integrationMult = 0.8 + factors.integrationComplexity * 0.1;
  const piiMult = factors.piiInLlm ? 1.25 : 1.0;
  const patternMult = patternMultiplier(factors.aiPattern);
  const corpusMult =
    factors.corpusDocCount > 10000
      ? 1.4
      : factors.corpusDocCount > 1000
        ? 1.2
        : 1.0;
  const toolMult = 1 + factors.agentToolCount * 0.08;
  const guardrailMult = 1 + factors.guardrailCount * 0.05;
  const writeMult = 1 + factors.writeActionCount * 0.1;
  const autonomyMult = 0.9 + factors.autonomyLevel * 0.05;
  const haMult = factors.haRequired ? 1.2 : 1.0;
  const redTeamMult = factors.redTeamRequired ? 1.15 : 1.0;

  const dataEngineeringHrs = Math.round(
    BASE_HOURS.dataEngineering * sourceMult * corpusMult,
  );
  const integrationHrs = Math.round(
    BASE_HOURS.integration * sourceMult * integrationMult,
  );
  const aiDevelopmentHrs = Math.round(
    BASE_HOURS.aiDevelopment * patternMult * toolMult * corpusMult,
  );
  const securityComplianceHrs = Math.round(
    BASE_HOURS.securityCompliance * piiMult * guardrailMult * writeMult,
  );
  const testingHrs = Math.round(
    BASE_HOURS.testing * writeMult * guardrailMult * redTeamMult,
  );
  const infrastructureHrs = Math.round(
    BASE_HOURS.infrastructure * haMult * patternMult * 0.5,
  );
  const changeMgmtHrs = Math.round(
    BASE_HOURS.changeMgmt *
      (1 + factors.endUserPersonaCount * 0.1) *
      autonomyMult,
  );

  const totalEstimatedHrs =
    dataEngineeringHrs +
    integrationHrs +
    aiDevelopmentHrs +
    securityComplianceHrs +
    testingHrs +
    infrastructureHrs +
    changeMgmtHrs;

  const calculatedCostBand = costBandFromHours(totalEstimatedHrs, rate);

  const llm = factors.monthlyLlmCost ?? 0;
  const infra = factors.monthlyInfraCost ?? 0;
  const hitl = (factors.hitlHoursPerMonth ?? 0) * (rate * 0.7);
  const estMonthlyRunCost = Math.round((llm + infra + hitl) * 100) / 100;

  return {
    dataEngineeringHrs,
    integrationHrs,
    aiDevelopmentHrs,
    securityComplianceHrs,
    testingHrs,
    infrastructureHrs,
    changeMgmtHrs,
    totalEstimatedHrs,
    calculatedCostBand,
    estMonthlyRunCost,
  };
}
